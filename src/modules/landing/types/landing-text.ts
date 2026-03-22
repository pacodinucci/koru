export type LandingTextMap = Record<string, string>;

export type LandingPreviewBindings = {
  previewMode?: boolean;
  selectedFieldId?: string | null;
  onSelectField?: (fieldId: string) => void;
};

export function getLandingFieldSizeKey(fieldId: string) {
  return `${fieldId}__size`;
}

export function getLandingFieldFontSize(
  textMap: LandingTextMap,
  fieldId: string,
  fallbackPx: number,
) {
  const raw = textMap[getLandingFieldSizeKey(fieldId)];
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return fallbackPx;
  }

  return Math.min(96, Math.max(10, parsed));
}
