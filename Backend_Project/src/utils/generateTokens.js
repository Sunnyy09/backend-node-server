import { User } from "../models/user.model.js";
import { apiError } from "./apiError.js";
import { apiResponse } from "./apiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong while genrating access and refresh token"
    );
  }
};

export { generateAccessAndRefreshTokens };
