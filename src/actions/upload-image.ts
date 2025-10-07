
"use server";

import {v2 as cloudinary} from 'cloudinary';

// Configure Cloudinary once when the module is loaded
if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

export async function uploadImage(formData: FormData): Promise<{success: boolean; url?: string; error?: string}> {
    // Check if configuration is valid before proceeding
    if (!cloudinary.config().api_key || !cloudinary.config().api_secret || !cloudinary.config().cloud_name) {
        const errorMsg = "Cloudinary environment variables are not configured.";
        console.error(errorMsg);
        return {success: false, error: errorMsg};
    }

    try {
        const file = formData.get('file') as File;
        if (!file) {
            return {success: false, error: "No file provided."};
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const uploadResult = await new Promise<{secure_url: string}>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    tags: ['ironawe-products'],
                    resource_type: 'auto',
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Error("Upload result is undefined."));
                    }
                }
            ).end(buffer);
        });

        return {success: true, url: uploadResult.secure_url};
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return {success: false, error: errorMessage};
    }
}
