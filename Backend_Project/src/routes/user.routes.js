import { Router } from "express";
import { registerUser } from "../conrollers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      maxCount: 1,
      name: "coverImage",
    },
  ]),
  registerUser
);
// router.route("/login").post(loginUser);

export default router;
