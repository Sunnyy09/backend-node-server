import { v2 as cloudinary } from "cloudinary";
import fs, { fstat } from "fs";
import { apiError } from "./apiError.js";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  console.log(localFilePath);
  try {
    if (!localFilePath) return null;

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "Backend_Project",
    });

    fs.unlinkSync(localFilePath);
    return result;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return error;
  }
};

const deleteFromCloudinary = async (url) => {
  try {
    if (!url) {
      throw new apiError(501, "No URL  provided for deletion");
    }

    const publicId = url.split("/").slice(-2).join("/").split(".")[0];
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    if (result.result === "ok") {
      console.log(`Deleted file: ${publicId}`);
      return true;
    } else {
      console.error(`Failed to delete file: ${publicId}`);
      return false;
    }
  } catch (error) {
    console.log("Error in deleteFromCloudinary", error.message);
  }
};

const deleteVideoFromCloudinary = async (url) => {
  try {
    if (!url) {
      throw new apiError(501, "No URL provided for video deletion");
    }

    const publicId = url.split("/").slice(-2).join("/").split(".")[0];
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });

    if (result.result === "ok") {
      console.log(`Successfully deleted file: ${publicId}`);
      return true;
    } else if (result.result === "not found") {
      console.log(`File not found in Cloudinary: ${publicId}`);
      return true; // File is already deleted, treat it as success
    } else {
      console.error(`Failed to delete file: ${publicId}`, result);
      return false;
    }
  } catch (error) {
    console.log("Error in delete video from Cloudinary", error.message);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary, deleteVideoFromCloudinary };
