import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import fs from "fs";
import Jwt from "jsonwebtoken";
import { generateAccessAndRefreshTokens } from "../utils/generateTokens.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }
  if (!email.includes("@")) {
    throw new apiError(400, "@ must be required in email");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new apiError(409, "User with email or username already exist");
  }

  // console.log(req.files);
  if (!req.files) {
    return res.status(400).json({ error: "No photo file uploaded" });
  }

  try {
    const avatarFile = req.files.avatar?.[0]?.path;
    const coverImageFile = req.files.coverImage?.[0]?.path;

    const avatar = await uploadOnCloudinary(avatarFile);
    const coverImage = await uploadOnCloudinary(coverImageFile);

    [avatarFile, coverImageFile].forEach((file) => {
      if (file?.path) {
        fs.unlinkSync(file.path);
      }
    });

    if (!avatar) {
      throw new apiError(400, "Avatar file is required");
    }

    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email,
      password,
      avatar: avatar.url, // public_url
      coverImage: coverImage?.url || "", // public_url
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

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(email || !username)) {
    throw new apiError(400, "username or email is required");
  }

  const registeredUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!registerUser) {
    throw new apiError(404, "User does not existed, Please sign up");
  }

  const isValidPassword = await registeredUser.isPasswordCorrect(password);

  if (!isValidPassword) {
    throw new apiError(401, "Invalid user credentials");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    registeredUser._id
  );

  // Exclude password and refreshToken: update the user object or used select() method
  // const {
  //   password: userPassword,
  //   refreshToken: userToken,
  //   ...filteredUser
  // } = user;
  // console.log(filteredUser);

  const loggedInUser = await User.findById(registeredUser._id).select(
    "-password -refreshToken"
  );

  // send cookies
  const options = {
    httpOnly: true,
    secure: true,
  };
  // by using these options, only server update the cookies not by client!

  // console.log(refreshToken);
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options) // ("value", key, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User LoggedIn Successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, "User logged Out Successfully  "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const clientRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!clientRefreshToken) {
      throw new apiError(401, "Unauthorized request");
    }

    const decodedToken = await Jwt.verify(
      clientRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new apiError(401, "Invalid refresh token");
    }

    if (clientRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          accessToken,
          newRefreshToken,
          "New Access token generated Successfully"
        )
      );
  } catch (error) {
    throw new apiError(
      401,
      error?.message || "New Access token is not generated"
    );
  }
});

export { registerUser, loginUser, logOutUser, refreshAccessToken };

/*  register user
  get the api request
  model
  validation  {username, email, password}
  check user if already exist: email or username
  check for avatar  
  upload avatar o cloudinary, validation of avatar
  create user object - create entry in db
  remove password and refresh token field from response
  check for user creation or null
  return response
*/

/*  login user
  get the api request: req.body
  validation  {email, password}
  already exist or not
  check for validate user with password check
  if password correct then, generate access token and refresh token
  send tokens with cookies
  send the response
*/
