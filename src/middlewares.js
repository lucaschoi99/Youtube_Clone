import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";

const s3 = new aws.S3({
    credentials: {
        accessKeyId: process.env.AWS_ID,
        secretAccessKey: process.env.AWS_SECRET
    }
});

const isHeroku = process.env.NODE_ENV === "production";

const s3ImageUploader = multerS3({
    s3: s3,
    bucket: 'youtubecloneproject/images',
    acl: "public-read",
});

const s3VideoUploader = multerS3({
    s3: s3,
    bucket: 'youtubecloneproject/videos',
    acl: "public-read",
});

export const localsMiddleware = (req, res, next) => {
    // Set locals
    res.locals.loggedIn = Boolean(req.session.loggedIn);
    res.locals.siteName = "Wetube";
    res.locals.loggedInUser = req.session.user || {};
    next();
};

// Middleware for loggedIn Users
export const protectMiddleWare = (req, res, next) => {
    if (req.session.loggedIn) {
        next();
    }
    else {
        req.flash("error", "Not authorized");
        return res.redirect("/login");
    }
}

// Middleware for not-loggedIn Users
export const publicOnlyMiddleware = (req, res, next) => {
    if (!req.session.loggedIn) {
        next();
    }
    else {
        req.flash("error", "Not authorized");
        return res.redirect("/");
    }
}

export const avatarUploadMiddleware = multer({
    dest: "uploads/avatars/",
    limits: { fileSize: 5000000, },
    storage: isHeroku ? s3ImageUploader : undefined,
});

export const videoUploadMiddleware = multer({
    dest: "uploads/videos/",
    limits: { fileSize: 500000000, },
    storage: isHeroku ? s3VideoUploader : undefined,
});