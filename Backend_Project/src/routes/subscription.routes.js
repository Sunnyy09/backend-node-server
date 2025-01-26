import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscritpion,
} from "../conrollers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/c/:channelId")
  .post(toggleSubscritpion)
  .get(getUserChannelSubscribers);

router.route("/u/:subscribedId").get(getSubscribedChannels);

export default router;
