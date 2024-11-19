import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { deleteVideo, getAllVideoFiles, getUserVideosById, publishAVideo, publishVideo, updateVideo } from "../controllers/video.controller.js";

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

//getALlVideos
router.route("/getAllVideos").get(getAllVideoFiles)

// get current videos list
router.route("/getCurrentUserVideos/:id").get(getUserVideosById)



// get current videos list 
router.route("/updateVideo/:id").patch(verifyJwt, upload.single("thumbnail"), updateVideo);

router.route("/deleteVideo/:videoId").delete(verifyJwt, deleteVideo);

router.route("/publishVideo/:videoId").patch(verifyJwt, publishAVideo);


export default router;