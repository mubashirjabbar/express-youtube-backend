import express from "express";
import dotenv from "dotenv"

import connectDb from "./db/index.js";

dotenv.config({
    path: "./env"
})

connectDb();

// const app = express();

// ; (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGO_DB_URL}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.error("Error: " + error);
//             throw error;
//         })

//         app.listen(process.env.PORT, () => {
//             console.log("listening on port " + process.env.PORT);
//         })

//     } catch (error) {
//         console.error("Error: " + error);
//         throw error;
//     }
// })()