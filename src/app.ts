
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"))
app.use(cookieParser());

//import routes 
import userRoutes from "./routes/user.routes"
import videoRouter from "./routes/video.routes"
import tweetsRouter from "./routes/tweet.routes"

app.use("/api/v1/users", userRoutes)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/tweets", tweetsRouter)

export { app }