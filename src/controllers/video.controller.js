import mongoose, { isValidObjectId, Schema } from "mongoose";
//@ts-ignore
import { ApiError } from "../utils/apiError.js";
import { Video } from "../models/video.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
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

const getAllVideoFiles = asyncHandler(async (req, res) => {

    const videoFiles = await Video.find();

    if (!videoFiles) {
        throw new ApiError(500, "Error while getting the video");
    }

    return res.status(200).json(new ApiResponse(200, videoFiles, "Videos fetched successfully"));


});

const getUserVideosById = asyncHandler(async (req, res) => {

    const { id } = req.params;

    if (!id) {
        throw new ApiError(500, "invalid id");
    }

    const videoFiles = await Video.findById(id);

    if (!videoFiles) {
        throw new ApiError(500, "Error while getting the video by user id");
    }

    return res.status(200).json(new ApiResponse(200, videoFiles, "Current user videos fetched successfully"));


});


const updateVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body;
    const { id } = req.params;

    if (!title || !description) {
        throw new ApiError(400, "Provide updated title and description");
    }

    if (!isValidObjectId(id)) {
        throw new ApiError(400, "Invalid Video ID");
    }
    // console.log("id---->", id);

    const video = await Video.findById(id);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    //if u aare the owner of the video
    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,"You can't edit this video as you are not the owner"
        );
    }

    // delete the old thumbnail
    const deleteThumbnailResponse = await deleteFromCloudinary(video.thumbnail);
    if (deleteThumbnailResponse.result !== "ok") {
        throw new ApiError(500, "Error while deleting old thumbnail from cloudinary");
    }

    const newThumbnailLocalPath = req.file?.path;

    if (!newThumbnailLocalPath) {
        throw new ApiError(400, "No new thumbnail file found");
    }

    // uploading video
    const thumbnailFileFormCloudinary = await uploadOnCloudinary(newThumbnailLocalPath);

    if (!thumbnailFileFormCloudinary) {
        throw new ApiError(400, "Error while uploading new thumbnail");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        id,
        {
            $set: {
                title: title,
                description: description,
                thumbnail: thumbnailFileFormCloudinary.url,
            }
        },
        { new: true }
    )

    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"));


});





export { publishVideo, getAllVideoFiles, getUserVideosById, updateVideo }