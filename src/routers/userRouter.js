import express from "express";
import { profile, logout, getEdit, postEdit, deleteUser, startGithubLogin, callbackGithubLogin, getChangePassword, postChangePassword} from "../controllers/userController";
import { avatarUploadMiddleware, protectMiddleWare, publicOnlyMiddleware } from "../middlewares";

const userRouter = express.Router();

userRouter.get("/logout", protectMiddleWare, logout);
userRouter.route("/edit").all(protectMiddleWare).get(getEdit).post(avatarUploadMiddleware.single("avatar"), postEdit);
userRouter.get("/github/start", publicOnlyMiddleware, startGithubLogin);
userRouter.get("/github/callback", publicOnlyMiddleware, callbackGithubLogin);
userRouter.route("/change-password").all(protectMiddleWare).get(getChangePassword).post(postChangePassword);

userRouter.get("/delete", deleteUser);
userRouter.get("/:id", profile);

// Export userRouter
export default userRouter;