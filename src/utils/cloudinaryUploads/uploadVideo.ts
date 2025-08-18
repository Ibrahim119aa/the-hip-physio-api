
import type {
  UploadApiOptions,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import streamifier from "streamifier";
import cloudinary from "../../config/cloudinaryConfig";

export type UploadVideoOptions = {
  folder?: string;                 // default: "hip-physio/educational/videos"
  publicId?: string;
  resourceType?: "video";          // keep as "video"
  chunkSize?: number;              // default: 6MB
  context?: Record<string, string> | string;
  overwrite?: boolean;             // default: true
};

export type UploadVideoResult = {
  asset_id: string;
  public_id: string;
  secure_url: string;
  duration?: number;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
};

export async function uploadVideo(
  fileBuffer: Buffer,
  opts: UploadVideoOptions = {}
): Promise<UploadVideoResult> {
  const {
    folder = "hip-physio/educational/videos",
    publicId,
    resourceType = "video",
    chunkSize = 6 * 1024 * 1024,
    context,
    overwrite = true,
  } = opts;

  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("uploadVideoToCloudinary: fileBuffer is empty");
  }

  const uploadOptions: UploadApiOptions & { chunk_size?: number } = {
    resource_type: resourceType,
    folder,
    public_id: publicId,
    chunk_size: chunkSize,
    overwrite,
    context,
  };

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_large_stream(
      uploadOptions,
      (
        error: UploadApiErrorResponse | undefined,
        res: UploadApiResponse | undefined
      ) => {
        if (error) return reject(error);
        resolve(res as UploadApiResponse);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });

  return {
    asset_id: result.asset_id!,
    public_id: result.public_id,
    secure_url: result.secure_url!,
    duration: result.duration,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}
