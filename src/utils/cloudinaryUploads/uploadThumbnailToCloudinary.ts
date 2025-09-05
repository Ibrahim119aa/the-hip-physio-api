import cloudinary from "../../config/cloudinaryConfig";
import ErrorHandler from "../errorHandlerClass";

export type UploadThumbResult = { url: string; publicId: string };

export const uploadThumbnailToCloudinary = async ( file: Express.Multer.File, subfolder: string ): Promise<UploadThumbResult> => {
  if (!file) throw new ErrorHandler(400, "No image file provided");
  if (!file.mimetype?.startsWith("image/")) throw new ErrorHandler(400, "File must be an image");
  if (file.size > 10 * 1024 * 1024) throw new ErrorHandler(400, "Image file size must be less than 10MB");

  const options = {
    resource_type: "image" as const,
    folder: `hip-physio/${subfolder}/thumbnails`,
    transformation: [{ crop: "scale", quality: "auto" }],
  };

  try {
    const filePath = (file as unknown as { path?: string })?.path;

    const res: any = filePath
      ? await cloudinary.uploader.upload(filePath, options)
      : await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          options
        );

    return { url: res.secure_url as string, publicId: res.public_id as string };
  } catch (err: any) {
    console.error("image upload failed:", err);
    throw err instanceof ErrorHandler
      ? err
      : new ErrorHandler(500, err?.message || err?.error?.message || "Failed to upload image");
  }
};
