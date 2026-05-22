const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export function cloudinaryImageUrl(publicId: string, fallbackSrc?: string) {
  if (!cloudName) return fallbackSrc ?? "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${publicId}`;
}
