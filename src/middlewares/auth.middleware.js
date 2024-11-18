import jwt from "jsonwebtoken"

import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js";

export const verifyJwt = asyncHandler(async (req, _, next) => {

    try {
        //get token form the cookies
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        // if token is not present
        if (!token) {
            throw new ApiError(401,"No access token found")
        }

        // check the token validity
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        //get the user details without the password and refresh token
        const user = await User.findById(decodedToken?._id).select("-password -refresh_token")

        // if token is not found 
        if (!user) {
            throw new ApiError(401, "Invalid access token")
        }

        //send the user request
        req.user = user;

        //go to the next middleware or route
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token")

    }

})