import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { createTweet } from "../controllers/tweet.controller.js";

const router = new Router();

router.route("/createTweet").post(verifyJwt, createTweet)



export default router;