import { Router } from "express";

import { verifyJwt } from "../middlewares/auth.middleware";
import { createTweet } from "../controllers/tweet.controller";

const router = Router();

router.route("/createTweet").post(verifyJwt, createTweet)


export default router;