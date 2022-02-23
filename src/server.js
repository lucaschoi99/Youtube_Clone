import express from "express";
import morgan from "morgan";
import session from "express-session";
import flash from "express-flash";
import MongoStore from "connect-mongo";
import globalRouter from "./routers/globalRouter";
import userRouter from "./routers/userRouter";
import videoRouter from "./routers/videoRouter";
import { localsMiddleware } from "./middlewares";
import apiRouter from "./routers/apiRouter";

const PORT = 4000;

// Create Express application
const app = express();
// Morgan - famous middleware
const logger = morgan("dev");

// view engine - pug(html)
app.set("view engine", "pug");

// Modify default view dir
app.set("views", process.cwd() + "/src/views");

app.use((req, res, next) => {
    res.header("Cross-Origin-Embedder-Policy", "require-corp");
    res.header("Cross-Origin-Opener-Policy", "same-origin");
    next();
});

// global middleware
app.use(logger);

// Understand Form, json-string values
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware (Remember every user)
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false, // Give sessions to the users (not everyone)
    store: MongoStore.create({
        mongoUrl: process.env.DB_URL
    }),
})
);

// Messages to users
app.use(flash());
// Access to session object - locals are accessible in pug files
app.use(localsMiddleware);

// Allow users to see folder/file
app.use("/uploads", express.static("uploads"));
app.use("/assets", express.static("assets"));

// Routers
app.use("/", globalRouter);
app.use("/users", userRouter);
app.use("/videos", videoRouter);
app.use("/api", apiRouter);

export default app;
