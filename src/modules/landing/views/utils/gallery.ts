export function getGalleryVariantValue(raw: string | undefined) {
  if (raw === "carousel" || raw === "stacked" || raw === "editorial") {
    return raw;
  }
  return "grid";
}

export function getGalleryAutoplaySecondsValue(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.min(10, Math.max(0, parsed));
}

export function getGalleryCaptionModeValue(raw: string | undefined) {
  if (raw === "none" || raw === "title-subtitle") {
    return raw;
  }
  return "title";
}

export function getGalleryCaptionContainerOpacityValue(
  rawOpacity: string | undefined,
  rawBackgroundMode: string | undefined,
) {
  const parsed = Number.parseInt(rawOpacity ?? "", 10);
  if (Number.isFinite(parsed)) {
    return Math.min(100, Math.max(0, parsed));
  }
  if (rawBackgroundMode === "off") {
    return 0;
  }
  return 80;
}

export function getGalleryCaptionContainerPaddingValue(
  raw: string | undefined,
  fallback: number,
) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(80, Math.max(0, parsed));
}

export function getGalleryGridImageShapeValue(raw: string | undefined) {
  if (raw === "square" || raw === "portrait" || raw === "landscape") {
    return raw;
  }
  return "landscape";
}

