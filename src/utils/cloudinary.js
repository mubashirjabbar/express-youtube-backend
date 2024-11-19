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

        //remove the file form the local server 
        fs.unlinkSync(localFilePath);

        //return the url of the uploaded image
        return result
    } catch (error) {

        //remove the localFilePath from the server
        fs.unlinkSync(localFilePath);
        return null
    }
}

const deleteFromCloudinary = async (cloudinaryFilepath) => {
    try {
        if (!cloudinaryFilepath) return null;

        // Extract the public ID from the URL
        const parts = cloudinaryFilepath.split("/");
        const fileWithExtension = parts.pop();
        const publicId = fileWithExtension.split(".")[0];

        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        console.error("Error while deleting file from Cloudinary:", error.message || error);
        return null;
    }
};


export { uploadOnCloudinary, deleteFromCloudinary }