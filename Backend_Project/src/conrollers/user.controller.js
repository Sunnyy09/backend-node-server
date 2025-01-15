import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;
  console.log(email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }
  //   if (!email.includes("@")) {
  //     throw new apiError(400, "@ must be required in email");
  //   }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  //   console.log(existedUser);

  if (existedUser) {
    throw new apiError(409, "User with email or username already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findById(user._id)?.select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createUser, "User registered Successfully"));
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
