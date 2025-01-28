import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { View } from "../models/view.model.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const addVideoView = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid Video ID");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new apiError(401, "User not authenticated");
  }

  // Use MongoDB upsert operation to reduce round-trips
  const addedView = await View.updateOne(
    { video: videoId, viewer: userId },
    { $setOnInsert: { video: videoId, viewer: userId, createdAt: new Date() } },
    { upsert: true }
  );

  const wasView = !!addedView.upsertedCount; // The !! converts the value to a boolean,  `true` if a new document was inserted and count will be 1

  // Add video to user's watch history (idempotent using $addToSet)
  await User.findByIdAndUpdate(
    userId,
    {
      $addToSet: { watchHistory: videoId },
    },
    {
      new: true,
    }
  );

  if (wasView) {
    await Video.findByIdAndUpdate(
      videoId,
      {
        $inc: { views: 1 },
      },
      {
        new: true,
      }
    );
  }

  const message = wasView
    ? "Video is viewed for the first time"
    : "Video has already been viewed";

  return res.status(200).json(new apiResponse(200, { videoId }, message));
});

const removeView = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid Video ID");
  }

  const userId = req.user?._id;
  if (!userId) {
    throw new apiError(401, "User not authenticated");
  }

  const removedView = await View.findOneAndDelete({
    video: videoId,
    viewer: userId,
  });

  await Video.findOneAndUpdate(
    { _id: videoId, views: { $gt: 0 } }, // Prevent decrementing below 0
    { $inc: { views: -1 } },
    { new: true }
  );

  if (!removeView) {
    throw new apiError(400, "No view to remove");
  }

  const removeFromWatchHistroy = await User.findByIdAndUpdate(
    userId,
    {
      $pull: {
        watchHistory: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!removeFromWatchHistroy) {
    throw new apiError(400, "Cannot remove from watch history");
  }

  return res
    .status(200)
    .json(new apiResponse(200, removedView, "Removed the view successfully"));
});

const getVideoViews = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid Video ID");
  }

  const views = await View.countDocuments({ video: videoId });
  if (!views) {
    return res.status(200, {}, "No viwes yet");
  }

  return res
    .status(200)
    .json(new apiResponse(200, views, "Views fetched successfully"));
});

export { addVideoView, removeView, getVideoViews };
