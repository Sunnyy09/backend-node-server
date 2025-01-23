import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
  deleteVideoFromCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const filter = {};
  if (query) {
    filter.title = { $regex: query, $options: "i" }; // Case-insensitive search by title
  }
  if (userId) {
    filter.owner = new mongoose.Types.ObjectId(userId); // Filter by userId if provided
  }

  const totalVideos = await Video.countDocuments(filter);

  // Fetch videos with aggregation for pagination, sorting, and population
  const videos = await Video.aggregate([
    { $match: filter }, // Match videos based on the filter
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" }, // Unwind the owner array into a single object
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        videoFile: 1,
        thumbnail: 1,
        duration: 1,
        createdAt: 1,
        views: 1,
        isPublished: 1,
        owner: 1,
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
    { $skip: (page - 1) * parseInt(limit) },
    { $limit: parseInt(limit) },
  ]);

  if (!videos.length) {
    throw new apiError(404, "No videos found");
  }

  // Pagination indicators
  const hasNextPage = page * limit < totalVideos;
  const hasPreviousPage = page > 1;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        totalVideos,
        currentPage: parseInt(page),
        limit: parseInt(limit),
        nextPage: hasNextPage ? parseInt(page) + 1 : null,
        previousPage: hasPreviousPage ? parseInt(page) - 1 : null,
        videos,
      },
      "Videos fetched successfully"
    )
  );
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new apiError(400, "All fields are required");
  }

  try {
    const videoPath = req.files.videoFile?.[0].path;
    const thumbnailPath = req.files.thumbnail?.[0].path;
    console.log(req.files);

    if (!videoPath) {
      throw new apiError(400, "Video path is not found");
    }
    if (!thumbnailPath) {
      throw new apiError(400, "Thumbnail path is required");
    }

    const videoFile = await uploadOnCloudinary(videoPath);
    if (!videoFile) {
      throw new apiError(400, "Video file is requried");
    }

    const thumbnailFile = await uploadOnCloudinary(thumbnailPath);
    if (!thumbnailFile) {
      throw new apiError(400, "Thumbnail file is required");
    }

    const video = await Video.create({
      title,
      description,
      duration: videoFile.duration,
      videoFile: videoFile.url,
      thumbnail: thumbnailFile.url,
      owner: req.user?._id,
      isPublished: false,
    });

    return res
      .status(200)
      .json(new apiResponse(200, video, "Video is published successfully"));
  } catch (error) {
    console.log("Error uploading Video", error);
    throw new apiError(400, "Failed to upload video");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "Invalid indentity of video");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(400, "Video is not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video fetched seccessfully"));
});

const updateVideoInfo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "Invalid Video ID");
  }

  const { title, description } = req.body;
  if (!(title || description)) {
    throw new apiError(400, "All fields are required");
  }
  const thumbnailPath = req.file?.path;
  if (!thumbnailPath) {
    throw new apiError(400, "thumbnail is required");
  }
  console.log("Received thumbnail:", thumbnailPath);

  const thumbnail = await uploadOnCloudinary(thumbnailPath);
  if (!thumbnail.url) {
    throw new apiError(400, "Error while thumbnail uploading on cloudinary");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    {
      new: true,
    },
    {
      runValidators: true, // Ensure schema validation is applied during update
    }
  );
  if (!video) {
    throw new apiError(400, "Video is not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video Info updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(400, "Video is not found");
  }

  const videoUrl = video.videoFile;
  if (!videoUrl) {
    throw new apiError(400, "Video URL is undefined");
  }

  const removeVideoFromCloudinary = await deleteVideoFromCloudinary(videoUrl);
  if (!removeVideoFromCloudinary) {
    throw new apiError(500, "Video deletion from cloudinary unsuccessful");
  }

  await video.deleteOne();

  return res
    .status(200)
    .json(new apiResponse(200, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "Invalid Video ID");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    {
      new: true,
    }
  );
  if (!video) {
    throw new apiError(400, "Video is not found");
  }

  await video.save();

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { isPublished: toggledVideoPublish.isPublished },
        "Video Unpublished successfully"
      )
    );
});

export {
  publishVideo,
  getAllVideos,
  getVideoById,
  updateVideoInfo,
  deleteVideo,
  togglePublishStatus,
};
