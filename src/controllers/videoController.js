// Renders pug file
// Controller sends variable pageTitle
import { isRedirect } from "node-fetch";
import Video from "../models/Video";
import User from "../models/User";
import Comment from "../models/Comment";
import { async } from "regenerator-runtime";

export const home = async (req, res) => {
    try {
        const videos = await Video.find({})
            .sort({ createdAt: "desc" })
            .populate("owner");
        return res.render("home", { pageTitle: "Home", videos });
    } catch (error) {
        return res.render("server-error", { error });
    }
}

export const watch = async (req, res) => {
    const { id } = req.params;
    // Populate : Get whole object "owner" by mongoose ref model
    const video = await Video.findById(id).populate("owner").populate("comments");

    if (!video) {
        return res.status(400).render("404", { pageTitle: "NOT FOUND" });
    }
    return res.render("videos/watch", { pageTitle: video.title, video });
}

export const getEdit = async (req, res) => {
    const { id } = req.params;
    const { user: { _id } } = req.session;
    const video = await Video.findById(id);
    if (!video) {
        return res.status(400).render("404", { pageTitle: "NOT FOUND" });
    }
    // If not owner, do not allow edit
    if (String(video.owner) !== String(_id)) {
        req.flash("error", "Not authorized");
        return res.status(403).redirect("/");
    }
    return res.render("videos/edit-video", { pageTitle: `Edit: ${video.title} `, video });
}
export const postEdit = async (req, res) => {
    const { id } = req.params;
    const { user: { _id } } = req.session;
    const { title, description, hashtags } = req.body;
    const video = await Video.findById(id);

    if (!video) {
        return res.status(404).render("404", { pageTitle: "NOT FOUND" });
    }
    // If not owner, do not allow edit
    if (String(video.owner) !== String(_id)) {
        return res.status(403).redirect("/");
    }
    await Video.findByIdAndUpdate(id, {
        title,
        description,
        hashtags: Video.formatHashtags(hashtags),
    });

    return res.redirect(`/videos/${id}`);
}

export const getUpload = (req, res) => {
    return res.render("upload", { pageTitle: "Upload Video" });
}

export const postUpload = async (req, res) => {
    const { user: { _id } } = req.session;
    const { video, thumb } = req.files;
    const isHeroku = process.env.NODE_ENV === "production";

    // Upload a video into the videos array
    const { title, description, hashtags } = req.body;
    try {
        const newVideo = await Video.create({
            title,
            description,
            fileUrl: video[0].path,
            thumbUrl: "/" + thumb[0].destination + thumb[0].filename,
            owner: _id,
            hashtags: Video.formatHashtags(hashtags),
        });
        const user = await User.findById(_id);
        user.videos.push(newVideo._id);
        user.save();
        return res.redirect("/");
    } catch (error) {
        return res.status(400).render("upload", {
            pageTitle: "Upload Video",
            errorMessage: error._message,
        });
    }
}

export const deleteVideo = async (req, res) => {
    const { id } = req.params;
    const { user: { _id } } = req.session;
    const video = await Video.findById(id);
    if (!video) {
        return res.status(400).render("404", { pageTitle: "NOT FOUND" });
    }
    // If not owner, do not allow delete
    if (String(video.owner) !== String(_id)) {
        return res.status(403).redirect("/");
    }
    await Video.findByIdAndDelete(id);
    // Delete a video
    return res.redirect("/");
}

export const search = async (req, res) => {
    const { keyword } = req.query;
    let videos = [];
    if (keyword) {
        // Search
        videos = await Video.find({
            title: {
                // Search video title that contains the keyword
                $regex: new RegExp(keyword, "i"),
            },
        }).populate("owner");
    }
    return res.render("videos/search", { pageTitle: "Search", videos });
};

export const registerView = async (req, res) => {
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) {
        return res.sendStatus(404);
    }
    video.meta.views += 1;
    await video.save();

    return res.sendStatus(200);
}

export const createComment = async (req, res) => {
    const {
        session: { user },
        body: { text },
        params: { id },
    } = req;

    const video = await Video.findById(id);
    if (!video) {
        return res.sendStatus(404);
    }

    const commentUser = await User.findById(user._id);
    if (!commentUser) {
        return res.sendStatus(404);
    }

    const comment = await Comment.create({
        text,
        owner: user._id,
        video: id,
    });
    video.comments.push(comment._id);
    commentUser.comments.push(comment._id);
    video.save();
    commentUser.save();

    return res.status(201).json({ newCommentId: comment._id });
}