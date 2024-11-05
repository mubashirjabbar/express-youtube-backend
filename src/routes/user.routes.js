import { Router } from "express";
import { registerUser, login, logout } from "../controllers/user.controller.js"

import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router = new Router();

//upload.fields is the middleware
router.route("/register").post(
    upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]),
    registerUser)

//login
router.route("/login").post(login)

router.route("/logout").post(verifyJwt, logout)


export default router