import jwt from "jsonwebtoken"
import mongoose, { Schema } from "mongoose";


import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/apiResponse.js"


//just pass the id if will create the new token and save them into db
const generateAccessAndRefreshToken = async (userId) => {
    try {
        //get user id which you want to save the token
        const user = await User.findById(userId);
        //generate token 
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        //saving it to db
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        //return the tokens
        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token")

    }
}

const registerUser = asyncHandler(async (req, res) => {

    const { username, email, password, fullName } = req.body;

    // if any field is missed
    if ([username, email, password, fullName].some((field) => field?.trim === "")) {
        throw new ApiError(400, "All fields are required")
    }

    //check the user on db by email and username
    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    })

    //if the user the already exists
    if (userExists) {
        throw new ApiError(400, "Username or email already exists")
    }

    //check the local path
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    //check the local path not found
    if (!avatarLocalPath) {
        throw new ApiError(400, "Image is required")
    }

    //upload the avatar on the cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    //if the avatar is not uploaded on the cloudinary
    if (!avatar) {
        throw new ApiError(400, "Avatar is uploading failed")
    }

    //create the new user on db
    const user = await User.create({
        fullName,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
        username: username?.toLowerCase(),
        email,
        password
    })


    //check the user is created or not and i dont want the password and refresh token to show on response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //if the user is not created 
    if (!createdUser) {
        throw new ApiError(500, "API error while creating user")
    }


    // everything is working fine send resp to frontend
    return res.status(200).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )
});

const login = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    // if any field is missed
    if ([username, email, password, password].some((field) => field?.trim === "")) {
        throw new ApiError(400, "All fields are required")
    }

    // if any field is missed
    if (!(username || email)) {
        throw new ApiError(404, "Username or password is required")
    }

    // check the user on db
    const user = await User.findOne({
        $or: [{ username, email }]
    })

    // if user is not found
    if (!user) {
        throw new ApiError(400, "User not found")
    }

    //check the password
    const isPasswordCorrect = await user.isPasswordCorrect(password)

    // if password is not found
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Password is not correct")
    }

    //getting the tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user?._id)

    //send the resp and user data to frontend right now im calling the db query you can just update the user object and send it to frontend
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //send cookies to frontend
    //it can only be edit from the backend side, user can change it form frontend side
    const options = {
        httpOnly: true,
        secure: true
    }

    //send response to frontend with access token and refresh token
    return res
        .status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            },
                "User logged In Successfully"
            )
        )

})

const logout = asyncHandler(async (req, res,) => {

    // find the id which you want to logout we can get this id form the frontend as well, but in this case we wrote the middleware who gave us the user id by there access token
    //and also we add new true it means give me the updated user object not the old one
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true,
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = (async (req, res) => {
    //get the token form the frontend or mobile
    const incomingToken = req.cookies.refreshToken || req.refreshToken

    //check the token that we have or not
    if (!incomingToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        //verify the token and its a refresh token beacuse we savde decoded token in the db not the actual one that we shared to the user to frontend
        const decodedToken = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET)

        //check the token in database which use having this token
        const user = await User.findById(decodedToken?._id)

        // if user not found
        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        // now check the both token which saved in the db and the user send us the token form the frontend or mobile
        //if they are not the same then it means user logged out from other device or browser and we should not give him new access token
        if (user.refreshToken !== incomingToken) {
            throw new ApiError(401, "Refresh token is expired")
        }

        //generate new access and refresh tokens
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        //send cookies to frontend
        //it can only be edit from the backend side, user can change it form frontend side
        const options = {
            httpOnly: true,
            secure: true
        }

        //send response to frontend with access token and refresh token
        return res
            .status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json(
                new ApiResponse(200, { accessToken, refreshToken: newRefreshToken },
                    "User token has been refresh successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "something went wrong")
    }
})

const changeUserPassword = (async (req, res) => {

    //get password from the frontend
    const { currentPassword, newPassword } = req.body

    // check the user on db which password you want to change   
    const user = await User.findById(req.user._id)

    // check the old password is correctly send by frontend user
    const passwordCorrect = await user.isPasswordCorrect(currentPassword)

    if (!passwordCorrect) {
        throw new ApiError(400, "Old password is incorrect")
    }

    //set new password
    user.password = newPassword

    // save new password without performing any validation
    await user.save({ validateBeforeSave: false })

    // send resp to frontend
    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    )
})

const getCurrentUser = (async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User fetched successfully")
    )
})

const updateUserDetails = (async (req, res) => {

    const { username, fullName } = req.body

    if (!username || !fullName) {
        throw new ApiError(400, "Fields are required")
    }

    //check the user form the db, id we got from the req.user._id
    const updatedUser = await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $set: { username, fullName }
        },
        { new: true }
        //send me the updated app when its values is updated
    ).select("-password")
    //give me the whole object without the password

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "User updated successfully")
    )

})

const getUserById = async (req, res, next) => {
    try {
        const { id } = req.query;

        if (!id) {
            throw new ApiError(400, "Id is required");
        }
        const user = await User.findById(id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        return res.status(200).json(
            new ApiResponse(200, user, "User found successfully")
        );
    } catch (error) {
        next(error); // Passes the error to an error-handling middleware
    }
};

const deleteUserById = (async (req, res) => {
    const { _id, } = req.body

    if (!_id) {
        throw new ApiError(400, "Id is required")
    }

    await User.findByIdAndDelete(_id);

    return res.status(200).json(
        new ApiResponse(200, {}, "User deleted successfully")
    )
})

const getAllUser = (async (req, res) => {
    const users = await User.find();

    return res.status(200).json(
        new ApiResponse(200, users, "Users fetched successfully")
    )
})

export { registerUser, login, logout, refreshAccessToken, changeUserPassword, getCurrentUser, updateUserDetails, getUserById, deleteUserById, getAllUser }