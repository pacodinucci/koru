export function getBlogShareImage(content: string): string | null {
  const source = content.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
  if (!source) return null;

  if (source.startsWith("/") && !source.startsWith("//")) return source;

  try {
    const imageUrl = new URL(source);
    if (imageUrl.protocol !== "http:" && imageUrl.protocol !== "https:") return null;

    // Use the same first photo, but keep multi-megabyte originals out of social previews.
    if (imageUrl.hostname === "res.cloudinary.com" && /^\/[^/]+\/image\/upload\//.test(imageUrl.pathname)) {
      imageUrl.pathname = imageUrl.pathname
        .replace("/image/upload/", "/image/upload/c_limit,w_1200,h_630,f_jpg,q_70/")
        .replace(/\.(png|webp|jpe?g)$/i, ".jpg");
    }

    return imageUrl.href;
  } catch {
    return null;
  }
}
