import { Router } from "express";
import { registerUser, login, logout, refreshAccessToken, changeUserPassword, getCurrentUser, updateUserDetails, getUserById, deleteUserById, getAllUser } from "../controllers/user.controller.js"

import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router = new Router();

//upload.fields is the middleware
router.route("/register").post(
    upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]),
    registerUser)

//login
router.route("/login").post(login)

// secure routes

//middleware to check the user form his token
router.route("/logout").post(verifyJwt, logout)

router.route("/refresh-Token").post(refreshAccessToken)

//middleware to check the user form his token
router.route("/change-password").post(verifyJwt, changeUserPassword)

router.route("/current-user").get(verifyJwt, getCurrentUser)

router.route("/update-user").post(verifyJwt, updateUserDetails)

router.route("/get-user").get(getUserById);

router.route("/delete-user").post(deleteUserById)

router.route("/getall-users").get(getAllUser)








export default router