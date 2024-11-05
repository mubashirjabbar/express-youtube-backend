import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/apiResponse.js"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        //get user id which you want to save the token
        const user = await User.findById(userId);
        //generate token 
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        //saving it
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
    console.log("email----->", email);
    console.log("password----->", password);


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
    console.log(email);

    // if any field is missed
    if ([username, email, password, password].some((field) => field?.trim === "")) {
        throw new ApiError(400, "All fields are required")
    }
    console.log("email----->", email);
    console.log("password----->", password);


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
    const { accessToken, refreshToken } = generateAccessAndRefreshToken(user?._id)

    //send the resp and user data to frontend right now im calling the db query you can just update the user object and send it to frontend
    const loggedIdUser = await User.findById(user._id).select("-password", "-refreshToken")

    //send cookies to frontend

    //it can only be edit from the backend side, user can change it form frontend side
    const options = {
        httpOnly: true,
        secure: true
    }

    //send response to frontend with access token and refresh token
    return res.send(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
        .json(200, {
            user: loggedIdUser, accessToken, refreshToken
        }, "User logged in successfully")



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
        .send(200)
        .clearCookie("accessToken", accessToken, options)
        .clearCookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {}, "User logged out"))



})

export { registerUser, login, logout }