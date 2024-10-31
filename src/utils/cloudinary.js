import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


//common function to upload images to the cloudinary files
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload on cloudinary
        const result = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
        console.log("File uploaded successfully on cloudinary", result.url);
        return result
    } catch (error) {

        //remove the localFilePath from the server
        fs.unlinkSync(localFilePath);
        return null

    }
}

export { uploadOnCloudinary }
