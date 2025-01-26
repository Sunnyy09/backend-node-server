import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new apiError(400, "Content is required");
  }

  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video is not found");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new apiError(500, "Failed to add comment please try again");
  }

  return res
    .status(200)
    .json(new apiResponse(200, comment, "Comment Added successfully"));
});

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid Video ID");
  }
  const { page = 1, limit = 10 } = req.query;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(req.user?._id),
                "$likes.likedBy",
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        content: 1,
        createdAt: 1,
        likesCount: 1,
        owner: {
          username: 1,
          fullName: 1,
          avatar: 1,
        },
        isLiked: 1,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: parseInt(limit),
    },
  ]);

  const totalComments = await Comment.countDocuments({
    video: videoId,
  });

  if (!comments.length) {
    throw new apiError(404, "No comments found for this video");
  }

  const hasNextPage = page * limit < totalComments;
  const hasPreviousPage = page > 1;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        totalComments,
        currentPage: parseInt(page),
        limit: parseInt(limit),
        nextPage: hasNextPage ? parseInt(page) + 1 : null,
        previousPage: hasPreviousPage ? parseInt(page) - 1 : null,
        comments,
      },
      "Comments fetched successfully"
    )
  );
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid Comment ID");
  }

  const { content } = req.body;
  if (!content) {
    throw new apiError(400, "Content is required");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new apiError(404, "Comment not found");
  }

  if (comment.owner?.toString() !== req.user._id.toString()) {
    throw new apiError(400, "Only Comment owner can edit their comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    comment._id,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedComment) {
    throw new apiError(500, "Failed to edit comment, please try again");
  }

  return res
    .status(200)
    .json(new apiResponse(200, updatedComment, "Comment Update successfully"));
});

const deleteComment = await asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid Comment ID");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new apiError(404, "Comment not found");
  }

  if (comment.owner?.toString() !== req.user?._id.toString()) {
    throw new apiError(400, "Only owner can delete their comment");
  }

  await Comment.findByIdAndDelete(comment._id);

  return res
    .status(200)
    .json(new apiResponse(200, { commentId }, "Comment deleted successfully"));
});

export { addComment, getVideoComments, updateComment, deleteComment };
