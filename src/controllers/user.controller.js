import jwt from "jsonwebtoken"
import mongoose, { Schema } from "mongoose";


import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/apiResponse.js"
//@ts-ignore
import { ApiError } from "../utils/apiError.js";
import { scheduleEmail } from "../utils/scheduleEmail.js";



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

    let userEmail = 'mubashir.jabbar97@gmail.com',
        verificationCode = Math.floor(100000 + Math.random() * 900000);
    scheduleEmail(userEmail, verificationCode);
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
    // Schedule email


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

        // to unset any thing in mongoes use unset for this, in this case we have refreshToken to be unset 1
        $unset: {
            refreshToken: 1
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

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image updated successfully")
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username) {
        throw new ApiError(400, "Username is required")
    }

    //now applying the aggregation
    const channel = await User.aggregate([
        //below is the our first pipeline we can add multiple pipelines
        //first pipeline, 
        {
            //how i need yo match with the username, means which thing you need to search
            $match: {
                username: username?.toLowerCase()
            }
        },

        //second pipeline
        {
            // where you need to aggregate the data
            $lookup: {
                // from where, in this case we have Subscription but as we know that in the monodb the model name is store like subscriptions means in plural form with small first letter

                // this subscriptions not Subscription
                from: "subscriptions",

                // what u need to see
                localField: "_id",

                // from where you need to see
                foreignField: "channel",

                // name of the field which show in the model when we send the response to user
                as: "subscribers"

            }
        },

        //third pipeline
        {
            // where you need to aggregate the data
            $lookup: {
                // from where, in this case we have Subscription but as we know that in the monodb the model name is store like subscriptions means in plural form with small first letter

                // this subscriptions not Subscription
                from: "subscriptions",

                // what u need to see
                localField: "_id",

                // from where you need to see the subscriber from subscription model in this we have the subscriber
                foreignField: "subscriber",

                // name of the field which show in the model when we send the response to user
                as: "subscribedTo"
            }
        },

        //fourth pipeline
        {
            //we need to add our documents means in the case we have the count
            $addFields: {
                // count of subscribers
                subscriberCount: { $size: "$subscribers" },

                // count of users who are subscribed to this user
                subscribedToCount: { $size: "$subscribedTo" },

                // we need to send the isSubscriber channel to frontend like true and false
                isSubscriber: {
                    $cond: {
                        // req?.user?._id we get when user is login if yes then we need to check that his id excite in all our subscribers if yes then we need to true otherwise false
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },

        //fifth pipeline 
        {
            // we need to send the only the document which is updated we don't need to send the all documents
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                isSubscriber: 1,

            }
        }



    ]);

    // now check the channel exist or not
    if (!channel.length) {
        throw new ApiError(404, "Channel not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    //fine the id user ligin and then convert it same that store in the DB, like objectId("12345")
    const id = new mongoose.Types.ObjectId(req.user._id)

    const user = await User.aggregate([
        {
            $match: {
                _id: id
            }
        },
        {
            $lookup: {
                //from where you need to look up  in the case we need to loop on the video
                from: "videos",

                // in user section we have the watchHistory
                localField: "watchHistory",

                // and its from video section id, when the id comes here is become the foreign key here. 
                foreignField: "_id",

                // which we need to share the to the frontend name of the object
                as: "watchHistory",

                // right now we don't have the owner
                // for the owner we need to call again the user model and ask for the data, for this we can use inside pipeline, this is the another method of calling it 
                pipeline: [
                    {
                        $lookup: {
                            // data form the other model, in the case we have the users
                            from: "users",

                            // our local field in this case we have the watchHistory
                            localField: "watchHistory.owner",

                            // and its from user section id, when the id comes here is become the foreign key here.
                            foreignField: "_id",

                            // which we need to share the to the frontend name of the object
                            as: "owner",

                            // now we are get only those values which we need to share
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                        coverImage: 1
                                    }
                                },
                                // we need to send the only owner to the frontend not the array[0] like this 
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner"
                                        }

                                    }
                                }
                            ]

                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, user[0]?.watchHistory, "Watched channel history fetched successfully")
        )
})


export {
    registerUser,
    login,
    logout,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateUserDetails,
    getUserById,
    deleteUserById,
    getAllUser,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}