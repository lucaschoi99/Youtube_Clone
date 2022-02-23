// Description of Data object shape
// Create Video Model

import mongoose from "mongoose"

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxLength: 80 },
    fileUrl: { type: String, required: true },
    thumbUrl: { type: String, required: true },
    description: { type: String, required: true, trim: true, minLength: 10 },
    createdAt: { type: Date, required: true, default: Date.now },
    hashtags: [{ type: String, required: true, trim: true }],
    meta: {
        views: { type: Number, default: 0 },
    },
    // ObjectId for ownership
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    comments: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: "Comment" }],
});

// Build own static function - to process hashtags
videoSchema.static("formatHashtags", function (hashtags) {
    return hashtags.split(",").map((word) => (word.startsWith("#") ? word : `#${word}`));
});


const videoModel = mongoose.model("Video", videoSchema);
export default videoModel;