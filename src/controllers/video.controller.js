import mongoose, { Schema } from "mongoose";

import { ApiError } from "../utils/apiError.js";
import { Video } from "../models/video.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";


const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;


    if (!title || !description) {
        throw new ApiError(400, "All Fields are required");
    }

    //get from local
    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    if (!videoFileLocalPath) {
        throw new ApiError(400, "No video file found");
    }
    // uploading video
    const videoFile = await uploadOnCloudinary(videoFileLocalPath);

    if (!videoFile.url) {
        throw new ApiError(500, "Error while uploading video file");
    }

    // check local
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "No thumbnail file found");
    }

    // uploading
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading thumbnail file");
    }

    // create new video in db
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user._id,
    });

    if (!video) {
        throw new ApiError(500, "Error while publishing the video");
    }

    // send response
    return res.status(200).json(new ApiResponse(200, video, "Video Published"));
});


export {
    publishVideo,
}