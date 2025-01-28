import { Router } from "express";
import {
  addVideoView,
  getVideoViews,
  removeView,
} from "../conrollers/view.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/:videoId")
  .post(addVideoView)
  .delete(removeView)
  .get(getVideoViews);

export default router;
