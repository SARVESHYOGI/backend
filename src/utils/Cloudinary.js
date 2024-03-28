import { v2 as cloudinary } from "cloudinary";
import e from "express";
import fs from "fs";



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        //checking
        if (!localFilePath) return null;
        //uploadind
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        //msg
        //console.log("file uploaded successfully", response.url);
        fs.unlinkSync(localFilePath);//remove file locally saved on temperory file


        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);//remove file locally saved on temperory file as the operation failed
        console.log("Error in uploading file", error);
        return null;
    }
}

export { uploadOnCloudinary }