import { Router } from "express";
import {
  toggleTweetLike,
  toggleVideoLike,
} from "../conrollers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);

export default router;
