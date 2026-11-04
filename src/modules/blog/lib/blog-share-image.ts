export function getBlogShareImage(content: string): string | null {
  const source = content.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
  if (!source) return null;

  if (source.startsWith("/") && !source.startsWith("//")) return source;

  try {
    const imageUrl = new URL(source);
    return imageUrl.protocol === "http:" || imageUrl.protocol === "https:"
      ? imageUrl.href
      : null;
  } catch {
    return null;
  }
}
