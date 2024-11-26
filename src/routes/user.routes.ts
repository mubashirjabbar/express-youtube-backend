import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { changeUserPassword, deleteUserById, getAllUser, getCurrentUser, getUserById, getUserChannelProfile, getWatchHistory, login, logout, refreshAccessToken, registerUser, updateUserAvatar, updateUserCoverImage, updateUserDetails, verifyAccount } from "../controllers/user.controller";
import { verifyJwt } from "../middlewares/auth.middleware";
import { loginLimiter } from "../utils/rateLimit";

const router = Router();

//upload.fields is the middleware
router.route("/register").post(
    upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]),
    registerUser)

router.route("/verification").post(verifyJwt, verifyAccount)

//login
router.route("/login").post(loginLimiter, login)

// secure routes

//middleware to check the user form his token
router.route("/logout").post(verifyJwt, logout)

router.route("/refresh-Token").post(refreshAccessToken)

//middleware to check the user form his token
router.route("/change-password").post(verifyJwt, changeUserPassword)

router.route("/current-user").get(verifyJwt, getCurrentUser)

router.route("/update-user").patch(verifyJwt, updateUserDetails)

router.route("/get-user").get(getUserById);

router.route("/delete-user").post(deleteUserById)

router.route("/getall-users").get(getAllUser)

router.route("/avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage)

// username is the params
router.route("/channel/:username").get(verifyJwt, getUserChannelProfile)

router.route("/history").get(verifyJwt, getWatchHistory)








export default router