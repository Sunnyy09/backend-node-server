import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
// import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import { apiResponse } from "../utils/apiResponse.js";
import path from "path";
import fs from "fs";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const upload = multer({ dest: "public/temp/" });

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;
  // console.log(email);
  console.log(req.file);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }
  //   if (!email.includes("@")) {
  //     throw new apiError(400, "@ must be required in email");
  //   }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new apiError(409, "User with email or username already exist");
  }

  if (!req.file) {
    return res.status(400).json({ error: "No photo file uploaded" });
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "image",
      folder: "Backend_Project",
    });

    fs.unlinkSync(req.file.path);

    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email,
      password,
      avatar: {
        public_id: result.public_id,
        secure_url: result.secure_url,
      },
    });
    // console.log(user);

    const createdUser = await User.findById(user._id)?.select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new apiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    return res
      .status(201)
      .json(new apiResponse(200, createdUser, "User registered Successfully"));
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export { registerUser };

//  get the api request
//  model
//  validation  {username, email, password}
//  check user if already exist: email or username
//  check for avatar
//  upload avatar o cloudinary, validation of avatar
//  create user object - create entry in db
//  remove password and refresh token field from response
//  check for user creation or null
//  return response
