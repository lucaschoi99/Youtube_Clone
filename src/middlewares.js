import multer from "multer";

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
});

export const videoUploadMiddleware = multer({
    dest: "uploads/videos/",
    limits: { fileSize: 500000000, },
})