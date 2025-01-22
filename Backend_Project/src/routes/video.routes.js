import { Router } from "express";
import {
  publishVideo,
  getAllVideos,
  getVideoById,
  updateVideoInfo,
  deleteVideo,
} from "../conrollers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .patch(upload.single("thumbnail"), updateVideoInfo)
  .delete(deleteVideo);

export default router;
