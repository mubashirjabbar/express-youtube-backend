import express from "express";
import dotenv from "dotenv"

import connectDb from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./env"
})

connectDb().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`)
    })
}).catch((error) => {
    console.log("Mongo db failed to connect", error);
});

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