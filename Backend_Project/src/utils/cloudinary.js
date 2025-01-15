import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
    });
    console.log(uploadResult);
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file
    //   as the ulpoad operation got failed
    console.log(error);
    //   return null;
  }

  // Optimize delivery by resizing and applying auto-format and auto-quality
  // const optimizeUrl = cloudinary.url("shoes", {
  //   resource_type: "auto",
  //   fetch_format: "auto",
  //   quality: "auto",
  // });

  // console.log(optimizeUrl);

  // Transform the image: auto-crop to square aspect_ratio
  // const autoCropUrl = cloudinary.url("shoes", {
  //   crop: "auto",
  //   gravity: "auto",
  //   width: 500,
  //   height: 500,
  // });

  // console.log(autoCropUrl);
};

export { uploadOnCloudinary };
