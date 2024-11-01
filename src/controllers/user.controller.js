import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/apiResponse.js"

const registerUser = asyncHandler(async (req, res) => {

    const { username, email, password, fullName } = req.body;


    // if any field is missed
    if ([username, email, password, fullName].some((field) => field?.trim === "")) {
        throw new ApiError(400, "All fields are required")
    }

    //check the user on db by email and username
    const userExists = User.find({
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
})

export { registerUser }