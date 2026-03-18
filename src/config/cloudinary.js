import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cek apakah Cloudinary sudah dikonfigurasi
export function isCloudinaryConfigured() {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== "your_api_key" &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== "your_api_secret"
  );
}

/**
 * Upload gambar dari URL (Discord attachment) ke Cloudinary.
 * Jika Cloudinary tidak terkonfigurasi atau gagal, gunakan URL Discord langsung.
 * @param {string} imageUrl - URL gambar dari Discord
 * @param {string} folder - Folder di Cloudinary
 * @param {string} publicId - Nama file (opsional)
 * @returns {Promise<string>} URL gambar (Cloudinary atau Discord)
 */
export async function uploadFromUrl(
  imageUrl,
  folder = "joki",
  publicId = null,
) {
  // Jika Cloudinary belum dikonfigurasi, langsung pakai URL Discord
  if (!isCloudinaryConfigured()) {
    console.warn(
      "⚠️ Cloudinary belum dikonfigurasi, menggunakan URL Discord langsung.",
    );
    return imageUrl;
  }

  const options = {
    folder,
    resource_type: "image",
    format: "webp",
    quality: "auto:good",
    transformation: [{ width: 800, crop: "limit" }],
    timeout: 30000, // 30 detik timeout
  };

  if (publicId) {
    options.public_id = publicId;
    options.overwrite = true;
  }

  try {
    const result = await cloudinary.uploader.upload(imageUrl, options);
    return result.secure_url;
  } catch (err) {
    // Jika upload gagal (timeout, network error, dll), gunakan URL Discord
    console.error(
      "⚠️ Cloudinary upload gagal, fallback ke URL Discord:",
      err.message,
    );
    return imageUrl;
  }
}

/**
 * Hapus gambar dari Cloudinary berdasarkan URL.
 * Hanya hapus jika URL adalah URL Cloudinary.
 * @param {string} imageUrl - URL gambar
 */
export async function deleteFromUrl(imageUrl) {
  if (!imageUrl || !isCloudinaryConfigured()) return;

  // Hanya hapus jika URL berasal dari Cloudinary
  if (!imageUrl.includes("cloudinary.com")) return;

  try {
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
    const match = imageUrl.match(regex);
    if (!match) return;

    const publicId = match[1];
    await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Deleted from Cloudinary: ${publicId}`);
  } catch (err) {
    console.error("⚠️ Error deleting from Cloudinary:", err.message);
  }
}

export default cloudinary;
