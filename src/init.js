import regeneratorRuntime from "regenerator-runtime";
import "dotenv/config"; // Set infos on .env file
import "./db";
import "./models/Video";
import "./models/User";
import "./models/Comment";
import app from "./server";

const PORT = process.env.PORT || 4000;

// Server Listening function
const handleListening = () => console.log(`✅Server listening on port http://localhost:${PORT}`);

// Listen port 4000, callback func -> handleListening
app.listen(PORT, handleListening);