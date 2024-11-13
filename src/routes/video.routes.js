import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { publishVideo } from "../controllers/video.controller.js";

const router = new Router();

//upload.fields is the middleware
router.route("/publishVideo").post(
    verifyJwt,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },

    ]),
    publishVideo)

export default router