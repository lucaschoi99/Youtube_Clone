import express from "express";
import { watch, getEdit, postEdit, deleteVideo, getUpload, postUpload } from "../controllers/videoController";
import { protectMiddleWare, videoUploadMiddleware } from "../middlewares";

const videoRouter = express.Router();

videoRouter
    .get("/:id([0-9a-f]{24})", watch);
videoRouter
    .route("/:id([0-9a-f]{24})/edit-video")
    .all(protectMiddleWare)
    .get(getEdit)
    .post(postEdit);
videoRouter
    .route("/:id([0-9a-f]{24})/delete-video")
    .all(protectMiddleWare)
    .get(deleteVideo);
videoRouter
    .route("/upload")
    .all(protectMiddleWare)
    .get(getUpload)
    .post(videoUploadMiddleware.fields([
        { name: "video" },
        { name: "thumb" },
    ]), postUpload);

// Export videoRouter
export default videoRouter;