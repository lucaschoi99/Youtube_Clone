import mongoose from "mongoose"

// Connection between nodejs and mongoDB
mongoose.connect(process.env.DB_URL, 
{useNewUrlParser: true, useUnifiedTopology: true,});

const db = mongoose.connection;

const handleOpen = () => console.log("Successfully Connected to DB ✔");
const handleError = () => console.log("DB ERROR", error);

// Checking connection
db.on("error", handleError);
db.once("open", handleOpen);