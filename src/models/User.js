import mongoose from "mongoose";
import bcrypt from "bcryptjs/dist/bcrypt";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    avatarUrl: String,
    snsLogin: { type: Boolean, default: false },
    username: { type: String, required: true, unique: true },
    password: { type: String, },
    name: { type: String, required: true },
    location: String,
    // ObjectId for ownership
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
});

userSchema.pre('save', async function () {
    // Saving encrypted password (5 times hashed)
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 5);
    }
})

const User = mongoose.model('User', userSchema);

export default User;