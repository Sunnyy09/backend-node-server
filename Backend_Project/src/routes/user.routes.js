import { Router } from "express";
import { registerUser } from "../conrollers/user.controller.js";
import { upload } from "../conrollers/user.controller.js";

const router = Router();

router.route("/register").post(upload.single("avatar"), registerUser);
// router.route("/login").post(loginUser);

export default router;
