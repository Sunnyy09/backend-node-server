import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscriptions.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const toggleSubscritpion = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new apiError(400, "Invalid Channel ID");
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed?._id);

    return res
      .status(200)
      .json(
        new apiResponse(200, { subscribed: false }, "Unsubscribed successfully")
      );
  }

  await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new apiResponse(200, { subscribed: true }, "Subscribed successfully")
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new apiError(400, "Invalid Channel ID");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribedToSubscriber",
            },
          },
          {
            $addFields: {
              subscribedToSubscriber: {
                $cond: {
                  if: {
                    $in: [channelId, "$subscribedToSubscriber.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
              subscribersCount: {
                $size: "$subscribedToSubscriber",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 0,
        subscriber: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
          subscribedToSubscriber: 1,
          subscribersCount: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

// const getSubscribedChannels = asyncHandler(async (req, res) => {
//   const { subscribedId } = req.params;

//   const subscribedChannels = await Subscription.aggregate([
//     {
//       $match: {
//         subscriber: new mongoose.Types.ObjectId(subscribedId),
//       },
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "channel",
//         foreignField: "_id",
//         as: "subscribedChannels",
//         pipeline: [
//           {
//             $lookup: {
//               from: "videos",
//               localField: "_id",
//               foreignField: "owner",
//               as: "videos",
//             },
//           },
//           {
//             $addFields: {
//               latestVideos: {
//                 $last: "$videos",
//               },
//             },
//           },
//         ],
//       },
//     },
//     {
//       $unwind: "$subscribedChannel",
//     },
//     {
//       $project: {
//         _id: 0,
//         subscribedChannel: {
//           _id: 1,
//           username: 1,
//           fullName: 1,
//           avatar: 1,
//           latestVideo: {
//             _id: 1,
//             videoFile: 1,
//             thumbnail: 1,
//             owner: 1,
//             title: 1,
//             description: 1,
//             duration: 1,
//             createdAt: 1,
//             views: 1,
//           },
//         },
//       },
//     },
//   ]);

//   return res
//     .status(200)
//     .json(
//       new apiResponse(
//         200,
//         subscribedChannels,
//         "Subscribed channels fetched successfully"
//       )
//     );
// });

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscribedId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.isValidObjectId(subscribedId)) {
    throw new apiError(400, "Invalid subscriber ID");
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscribedId),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
      },
    },
    {
      $unwind: "$channelDetails", // Deconstruct the array to get the populated object directly
    },
    {
      $project: {
        _id: 0,
        "channel._id": "$channelDetails._id",
        "channel.fullName": "$channelDetails.fullName",
        "channel.avatar": "$channelDetails.avatar",
        "channel.username": "$channelDetails.username",
      },
    },
  ]);

  if (!channels.length) {
    throw new apiError(400, "Not subscribed to any channel");
  }

  const channelIds = channels.map((channel) => channel.channel);

  const skip = (page - 1) * limit;

  const videos = await Video.find({
    owner: { $in: channelIds },
  })
    .populate("owner")
    .sort({ createdAt: -1 })
    .skip(skip) //
    .limit(Number(limit));

  if (!videos.length) {
    throw new ApiError(404, "No videos found from the subscribed channels");
  }

  const totalVideos = await Video.countDocuments({
    owner: { $in: channelIds },
  });

  const tweets = await User.aggregate([
    {
      $match: {
        _id: { $in: channelIds.map((channel) => channel._id) }, // Extract `_id` from each channel object
      },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: "userTweets",
      },
    },
    {
      $unwind: "$userTweets", // Deconstruct the `userTweets` array into individual documents
    },
    {
      $sort: {
        "userTweets.createdAt": -1,
      },
    },
    {
      $group: {
        _id: "$_id", // Group back by user
        fullName: { $first: "$fullName" },
        avatar: { $first: "$avatar" },
        userTweets: {
          $push: {
            _id: "$userTweets._id",
            content: "$userTweets.content",
            createdAt: "$userTweets.createdAt",
          },
        },
      },
    },
  ]);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        channels,
        videos,
        tweets,
        pagination: {
          totalVideos,
          totalPages: Math.ceil(totalVideos / limit),
          currentPage: Number(page),
        },
      },
      "Channels and videos fetched successfully"
    )
  );
});

export { toggleSubscritpion, getUserChannelSubscribers, getSubscribedChannels };
