import { v2 as cloudinary } from "cloudinary";
import fs, { fstat } from "fs";

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
    // console.log(uploadResult);
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the ulpoad operation got failed
    console.log(error);
    return null;
  }
};

export { uploadOnCloudinary };
