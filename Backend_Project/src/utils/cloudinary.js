import { vs as cloudinary } from "cloudinary";
import fs from "fs";

import { v2 as cloudinary } from "cloudinary";

(async function (localFilePath) {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Upload an image
  const uploadResult = await cloudinary.uploader
    .upload(localFilePath, {
      public_id: "shoes",
    })
    .catch((error) => {
      fs.unlinkSync(localFilePath); // remove the locally saved temporary file
      //   as the ulpoad operation got failed
      console.log(error);
      //   return null;
    });

  console.log(uploadResult);

  // Optimize delivery by resizing and applying auto-format and auto-quality
  const optimizeUrl = cloudinary.url("shoes", {
    resource_type: "auto",
    fetch_format: "auto",
    quality: "auto",
  });

  console.log(optimizeUrl);

  // Transform the image: auto-crop to square aspect_ratio
  const autoCropUrl = cloudinary.url("shoes", {
    crop: "auto",
    gravity: "auto",
    width: 500,
    height: 500,
  });

  console.log(autoCropUrl);
})();
