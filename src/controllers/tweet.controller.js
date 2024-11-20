import jwt from "jsonwebtoken"
import mongoose, { Schema } from "mongoose";


import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Tweet } from "../models/tweet.model.js"
import { ApiResponse } from "../utils/apiResponse.js"
//@ts-ignore
import { ApiError } from "../utils/apiError.js";


const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "content is required");
    }

    const createdTweet = await Tweet.create({
        content,
        owner: req.user._id,
    });

    const tweet = await Tweet.aggregate([
        {
            $match: {
                _id: createdTweet._id, // Match only the newly created tweet by its `_id`
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: {
                path: "$ownerDetails", // Flatten the ownerDetails array
                preserveNullAndEmptyArrays: true, // Include videos without an owner
            },
        },
        {
            $project: {
                _id: 1,
                content: 1,
                owner: {
                    _id: "$ownerDetails._id",
                    fullName: "$ownerDetails.fullName",
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar",
                },
                createdAt: 1,
                updatedAt: 1,
            }
        },
    ])

    if (!tweet || tweet.length === 0) {
        throw new ApiError(400, "Failed to create and fetch the tweet");
    }

    // Return the single created tweet
    return res.status(200).json(new ApiResponse(200, tweet[0], "Tweet created successfully"));

});


export { createTweet, }
