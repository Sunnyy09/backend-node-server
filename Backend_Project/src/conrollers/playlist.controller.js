import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlists.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim() || !description?.trim()) {
    throw new apiError(400, "name and description both are required");
  }

  const videos = [];

  const playlist = await Playlist.create({
    name,
    description,
    videos,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new apiError(500, "Playlist is not created");
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist is created successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId || !isValidObjectId(videoId))) {
    throw new apiError(400, "Invalid Playlist ID or Video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(400, "Playlist not found");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(400, "Video not found");
  }

  if (
    (playlist.owner?.toString() && video.owner?.toString()) !==
    req.user._id.toString()
  ) {
    throw new apiError(400, "Only owner can add video to their playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new apiError(400, "Failed to add video to playlist");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        updatedPlaylist,
        "Added video to playlist successfully"
      )
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new apiError(400, "Invalid User ID");
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, playlists, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new apiError(400, "Invalid Playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(400, "playlist is not fetched successfully");
  }

  const playlistVideos = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $match: {
        "videos.isPublished": true,
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
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        videos: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
        },
        owner: {
          username: 1,
          fullName: 1,
          avatar: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(200, playlistVideos[0], "Playlist fetched successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid Playlist ID and Video ID ");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(400, "Playlist not found");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(400, "Video is not found");
  }

  if (
    (playlist.owner?.toString() && video.owner.toString()) !==
    req.user?._id.toString()
  ) {
    throw new ApiError(404, "only owner can remove video from thier playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        updatedPlaylist,
        "Remove video from playlist successfully"
      )
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new apiError(400, "Invalid Playlist ID");
  }
  if (!name && !description) {
    throw new apiError(400, "name and description are required");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(404, "Playlist is not found");
  }

  if (playlist.owner?.toString() !== req.user?._id.toString()) {
    throw new apiError(400, "Only owner can edit the playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist?._id,
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedPlaylist, "playlist updated successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId) {
    throw new apiError(400, "Invalid Playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }

  if (playlist.owner?.toString() !== req.user?._id.toString()) {
    throw new apiError(400, "Only owner can delete the playlist");
  }

  await Playlist.findByIdAndDelete(playlist._id);

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Playlist deleted successfully"));
});

export {
  createPlaylist,
  addVideoToPlaylist,
  getUserPlaylists,
  getPlaylistById,
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist,
};
