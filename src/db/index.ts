import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_DB_URL}/${DB_NAME}`)
        console.log(`\n Mongo DB connection established DB host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Mongoose db connection FAILED", error);
        process.exit(1);
    }
}

export default connectDb;