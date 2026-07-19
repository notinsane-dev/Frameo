import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export default cloudinary

export async function uploadProfilePicture(
  file: Buffer,
  userId: string,
  oldPublicId?: string,
): Promise<{ url: string; publicId: string }> {
  if (oldPublicId) {
    await cloudinary.uploader.destroy(oldPublicId)
  }

  const result = await new Promise<{
    secure_url: string
    public_id: string
  }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "cineai/avatars",
        public_id: `user_${userId}`,
        overwrite: true,
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto:best" },
          { fetch_format: "auto" },
          { radius: "max" },
        ],
        eager: [
          { width: 40, height: 40, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" },
          { width: 80, height: 80, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" },
          { width: 160, height: 160, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" },
        ],
        eager_async: false,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error || new Error("Cloudinary upload failed"))
          return
        }

        resolve({
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        })
      },
    ).end(file)
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}

export function getOptimizedAvatarUrl(publicId: string, size: 40 | 80 | 160 | 400 = 80): string {
  return cloudinary.url(publicId, {
    width: size,
    height: size,
    crop: "fill",
    gravity: "face",
    quality: "auto:best",
    fetch_format: "auto",
    radius: "max",
    secure: true,
  })
}
