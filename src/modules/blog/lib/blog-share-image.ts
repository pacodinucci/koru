import sharePreview from "@/lib/share-preview.json";

export function getBlogShareImage(content: string): string {
  const source = content.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
  if (!source) return sharePreview.url;

  if (source.startsWith("/") && !source.startsWith("//")) return source;

  try {
    const imageUrl = new URL(source);
    return imageUrl.protocol === "http:" || imageUrl.protocol === "https:"
      ? imageUrl.href
      : sharePreview.url;
  } catch {
    return sharePreview.url;
  }
}
