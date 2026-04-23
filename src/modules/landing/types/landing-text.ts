export type LandingTextMap = Record<string, string>;
export type LandingFontFamily = "montserrat" | "nunito" | "fira-sans";
export type LandingButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link"
  | "custom";
export type LandingFieldBorderStyle = "solid" | "dashed" | "dotted" | "none";

export type LandingPreviewBindings = {
  previewMode?: boolean;
  selectedFieldId?: string | null;
  onSelectField?: (fieldId: string) => void;
  onMoveSectionExtraPosition?: (
    sectionId: string,
    extraId: string,
    positionX: number,
    positionY: number,
  ) => void;
};

export function getLandingFieldSizeKey(fieldId: string) {
  return `${fieldId}__size`;
}

export function getLandingFieldColorKey(fieldId: string) {
  return `${fieldId}__color`;
}

export function getLandingFieldBackgroundColorKey(fieldId: string) {
  return `${fieldId}__bg_color`;
}

export function getLandingFieldBorderColorKey(fieldId: string) {
  return `${fieldId}__border_color`;
}

export function getLandingFieldBorderWidthKey(fieldId: string) {
  return `${fieldId}__border_width`;
}

export function getLandingFieldBorderRadiusKey(fieldId: string) {
  return `${fieldId}__border_radius`;
}

export function getLandingFieldBorderStyleKey(fieldId: string) {
  return `${fieldId}__border_style`;
}

export function getLandingFieldFontFamilyKey(fieldId: string) {
  return `${fieldId}__font_family`;
}

export function getLandingFieldFontWeightKey(fieldId: string) {
  return `${fieldId}__font_weight`;
}

export function getLandingFieldButtonVariantKey(fieldId: string) {
  return `${fieldId}__button_variant`;
}

export function getLandingFieldLineWidthKey(fieldId: string) {
  return `${fieldId}__line_width`;
}

export function getLandingFieldMarginKey(fieldId: string) {
  return `${fieldId}__margin`;
}

export function getLandingFieldPaddingKey(fieldId: string) {
  return `${fieldId}__padding`;
}

export function getLandingFieldPaddingXKey(fieldId: string) {
  return `${fieldId}__padding_x`;
}

export function getLandingFieldPaddingYKey(fieldId: string) {
  return `${fieldId}__padding_y`;
}

export function getLandingFieldPaddingTopKey(fieldId: string) {
  return `${fieldId}__padding_top`;
}

export function getLandingFieldPaddingRightKey(fieldId: string) {
  return `${fieldId}__padding_right`;
}

export function getLandingFieldPaddingBottomKey(fieldId: string) {
  return `${fieldId}__padding_bottom`;
}

export function getLandingFieldPaddingLeftKey(fieldId: string) {
  return `${fieldId}__padding_left`;
}

export type SpacingMode = "all" | "axis" | "sides";

export function getLandingFieldMarginModeKey(fieldId: string) {
  return `${fieldId}__margin_mode`;
}

export function getLandingFieldMarginXKey(fieldId: string) {
  return `${fieldId}__margin_x`;
}

export function getLandingFieldMarginYKey(fieldId: string) {
  return `${fieldId}__margin_y`;
}

export function getLandingFieldMarginTopKey(fieldId: string) {
  return `${fieldId}__margin_top`;
}

export function getLandingFieldMarginRightKey(fieldId: string) {
  return `${fieldId}__margin_right`;
}

export function getLandingFieldMarginBottomKey(fieldId: string) {
  return `${fieldId}__margin_bottom`;
}

export function getLandingFieldMarginLeftKey(fieldId: string) {
  return `${fieldId}__margin_left`;
}

export function getLandingFieldPaddingModeKey(fieldId: string) {
  return `${fieldId}__padding_mode`;
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

  return Math.min(800, Math.max(10, parsed));
}

function getValidHexColor(raw: string | undefined) {
  const normalized = raw?.trim();
  if (!normalized) {
    return null;
  }

  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized);
  if (isHex) {
    return normalized;
  }

  return null;
}

export function getLandingFieldColor(textMap: LandingTextMap, fieldId: string) {
  return getValidHexColor(textMap[getLandingFieldColorKey(fieldId)]);
}

export function getLandingFieldBackgroundColor(
  textMap: LandingTextMap,
  fieldId: string,
) {
  const raw = textMap[getLandingFieldBackgroundColorKey(fieldId)]?.trim();
  if (raw === "transparent") {
    return raw;
  }

  return getValidHexColor(raw);
}

export function getLandingFieldBorderColor(
  textMap: LandingTextMap,
  fieldId: string,
) {
  return getValidHexColor(textMap[getLandingFieldBorderColorKey(fieldId)]);
}

export function getLandingFieldFontFamily(
  textMap: LandingTextMap,
  fieldId: string,
): LandingFontFamily | null {
  const raw = textMap[getLandingFieldFontFamilyKey(fieldId)]?.trim();
  if (raw === "montserrat" || raw === "nunito" || raw === "fira-sans") {
    return raw;
  }

  return null;
}

export function getLandingFieldFontWeight(
  textMap: LandingTextMap,
  fieldId: string,
) {
  const raw = textMap[getLandingFieldFontWeightKey(fieldId)]?.trim();
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (parsed >= 100 && parsed <= 900 && parsed % 100 === 0) {
    return parsed;
  }

  return null;
}

export function getLandingFieldButtonVariant(
  textMap: LandingTextMap,
  fieldId: string,
): LandingButtonVariant {
  const raw = textMap[getLandingFieldButtonVariantKey(fieldId)]?.trim();
  if (
    raw === "default" ||
    raw === "outline" ||
    raw === "secondary" ||
    raw === "ghost" ||
    raw === "destructive" ||
    raw === "link" ||
    raw === "custom"
  ) {
    return raw;
  }

  return "default";
}

function getBoundedOptionalNumber(
  textMap: LandingTextMap,
  key: string,
  min: number,
  max: number,
) {
  const raw = textMap[key];
  if (raw == null || raw.trim() === "") {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(max, Math.max(min, parsed));
}

export function getLandingFieldBorderWidth(
  textMap: LandingTextMap,
  fieldId: string,
) {
  return getBoundedOptionalNumber(
    textMap,
    getLandingFieldBorderWidthKey(fieldId),
    0,
    20,
  );
}

export function getLandingFieldBorderRadius(
  textMap: LandingTextMap,
  fieldId: string,
) {
  return getBoundedOptionalNumber(
    textMap,
    getLandingFieldBorderRadiusKey(fieldId),
    0,
    80,
  );
}

export function getLandingFieldBorderStyle(
  textMap: LandingTextMap,
  fieldId: string,
): LandingFieldBorderStyle | null {
  const raw = textMap[getLandingFieldBorderStyleKey(fieldId)]?.trim();
  if (raw === "solid" || raw === "dashed" || raw === "dotted" || raw === "none") {
    return raw;
  }

  return null;
}

export function getLandingFieldLineWidth(
  textMap: LandingTextMap,
  fieldId: string,
  fallbackPx = 1,
) {
  const raw = textMap[getLandingFieldLineWidthKey(fieldId)];
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return fallbackPx;
  }

  return Math.min(40, Math.max(1, parsed));
}

function getLandingFieldSpacing(
  textMap: LandingTextMap,
  fieldId: string,
  keyBuilder: (id: string) => string,
) {
  const raw = textMap[keyBuilder(fieldId)];
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(120, Math.max(0, parsed));
}

export function getLandingFieldMargin(textMap: LandingTextMap, fieldId: string) {
  return getLandingFieldSpacing(textMap, fieldId, getLandingFieldMarginKey);
}

export function getLandingFieldPadding(textMap: LandingTextMap, fieldId: string) {
  return getLandingFieldSpacing(textMap, fieldId, getLandingFieldPaddingKey);
}

function getOptionalSpacingValue(raw: string | undefined) {
  if (raw == null || raw.trim() === "") {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(120, Math.max(0, parsed));
}

function getSpacingMode(raw: string | undefined): SpacingMode {
  if (raw === "axis" || raw === "sides") {
    return raw;
  }

  return "all";
}

export function getLandingFieldPaddingStyle(textMap: LandingTextMap, fieldId: string) {
  const modeRaw = textMap[getLandingFieldPaddingModeKey(fieldId)];
  const hasAnyPaddingValue =
    modeRaw != null ||
    textMap[getLandingFieldPaddingKey(fieldId)] != null ||
    textMap[getLandingFieldPaddingXKey(fieldId)] != null ||
    textMap[getLandingFieldPaddingYKey(fieldId)] != null ||
    textMap[getLandingFieldPaddingTopKey(fieldId)] != null ||
    textMap[getLandingFieldPaddingRightKey(fieldId)] != null ||
    textMap[getLandingFieldPaddingBottomKey(fieldId)] != null ||
    textMap[getLandingFieldPaddingLeftKey(fieldId)] != null;

  if (!hasAnyPaddingValue) {
    return {};
  }

  const mode = getSpacingMode(modeRaw);
  const padding = getOptionalSpacingValue(textMap[getLandingFieldPaddingKey(fieldId)]) ?? 0;
  const paddingX = getOptionalSpacingValue(textMap[getLandingFieldPaddingXKey(fieldId)]) ?? 0;
  const paddingY = getOptionalSpacingValue(textMap[getLandingFieldPaddingYKey(fieldId)]) ?? 0;
  const paddingTop = getOptionalSpacingValue(textMap[getLandingFieldPaddingTopKey(fieldId)]) ?? 0;
  const paddingRight = getOptionalSpacingValue(textMap[getLandingFieldPaddingRightKey(fieldId)]) ?? 0;
  const paddingBottom = getOptionalSpacingValue(textMap[getLandingFieldPaddingBottomKey(fieldId)]) ?? 0;
  const paddingLeft = getOptionalSpacingValue(textMap[getLandingFieldPaddingLeftKey(fieldId)]) ?? 0;

  const style: {
    padding?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
  } = {};

  if (mode === "all") {
    style.padding = `${padding}px`;
  }
  if (mode === "axis") {
    style.paddingLeft = `${paddingX}px`;
    style.paddingRight = `${paddingX}px`;
    style.paddingTop = `${paddingY}px`;
    style.paddingBottom = `${paddingY}px`;
  }
  if (mode === "sides") {
    style.paddingTop = `${paddingTop}px`;
    style.paddingRight = `${paddingRight}px`;
    style.paddingBottom = `${paddingBottom}px`;
    style.paddingLeft = `${paddingLeft}px`;
  }

  return style;
}

export function getLandingFieldMarginStyle(textMap: LandingTextMap, fieldId: string) {
  const modeRaw = textMap[getLandingFieldMarginModeKey(fieldId)];
  const hasAnyMarginValue =
    modeRaw != null ||
    textMap[getLandingFieldMarginKey(fieldId)] != null ||
    textMap[getLandingFieldMarginXKey(fieldId)] != null ||
    textMap[getLandingFieldMarginYKey(fieldId)] != null ||
    textMap[getLandingFieldMarginTopKey(fieldId)] != null ||
    textMap[getLandingFieldMarginRightKey(fieldId)] != null ||
    textMap[getLandingFieldMarginBottomKey(fieldId)] != null ||
    textMap[getLandingFieldMarginLeftKey(fieldId)] != null;

  if (!hasAnyMarginValue) {
    return {};
  }

  const mode = getSpacingMode(modeRaw);
  const margin = getOptionalSpacingValue(textMap[getLandingFieldMarginKey(fieldId)]) ?? 0;
  const marginX = getOptionalSpacingValue(textMap[getLandingFieldMarginXKey(fieldId)]) ?? 0;
  const marginY = getOptionalSpacingValue(textMap[getLandingFieldMarginYKey(fieldId)]) ?? 0;
  const marginTop = getOptionalSpacingValue(textMap[getLandingFieldMarginTopKey(fieldId)]) ?? 0;
  const marginRight = getOptionalSpacingValue(textMap[getLandingFieldMarginRightKey(fieldId)]) ?? 0;
  const marginBottom = getOptionalSpacingValue(textMap[getLandingFieldMarginBottomKey(fieldId)]) ?? 0;
  const marginLeft = getOptionalSpacingValue(textMap[getLandingFieldMarginLeftKey(fieldId)]) ?? 0;

  const style: {
    margin?: string;
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
  } = {};

  if (mode === "all") {
    style.margin = `${margin}px`;
  }
  if (mode === "axis") {
    style.marginLeft = `${marginX}px`;
    style.marginRight = `${marginX}px`;
    style.marginTop = `${marginY}px`;
    style.marginBottom = `${marginY}px`;
  }
  if (mode === "sides") {
    style.marginTop = `${marginTop}px`;
    style.marginRight = `${marginRight}px`;
    style.marginBottom = `${marginBottom}px`;
    style.marginLeft = `${marginLeft}px`;
  }

  return style;
}
