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
  // Upload an image
  try {
    if (!localFilePath) return null;
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "Backend_Project",
    });
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.log(uploadResult);
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the ulpoad operation got failed
    console.log(error);
    return null;
  }
};

const deleteFromCloudinary = async (url) => {
  try {
    if (!url) {
      throw new apiError(501, "No URL  provided for deletion");
    }

    const publicId = url.split("/").slice(-2).join("/").split(".")[0];
    const result = await cloudinary.uploader.destroy(publicId);

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

export { uploadOnCloudinary, deleteFromCloudinary };
