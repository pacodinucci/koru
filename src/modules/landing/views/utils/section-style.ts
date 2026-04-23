import type { LandingTextMap } from "@/modules/landing/types/landing-text";
import {
  getSectionBackgroundColorKey,
  getSectionBackgroundGradientKey,
  getSectionBackgroundImageKey,
  getSectionBackgroundModeKey,
  getSectionBackgroundPositionXKey,
  getSectionBackgroundPositionYKey,
  getSectionBackgroundZoomKey,
  getSectionBorderColorKey,
  getSectionBorderRadiusKey,
  getSectionBorderStyleKey,
  getSectionBorderWidthKey,
  parseSectionItemsOrder,
} from "@/modules/landing/config/landing-sections";
import type { CSSProperties } from "react";

export function getSectionOrderMap(textMap: LandingTextMap, sectionId: string) {
  return new Map(
    parseSectionItemsOrder(textMap, sectionId).map((id, index) => [id, index]),
  );
}

export function getOrder(
  orderMap: Map<string, number>,
  itemId: string,
  fallback: number,
) {
  return orderMap.get(itemId) ?? fallback;
}

export function getSectionBackgroundStyle(
  textMap: LandingTextMap,
  sectionId: string,
): CSSProperties {
  const rawMode = textMap[getSectionBackgroundModeKey(sectionId)]?.trim();
  const image = textMap[getSectionBackgroundImageKey(sectionId)]?.trim();
  const color = textMap[getSectionBackgroundColorKey(sectionId)]?.trim();
  const gradient = textMap[getSectionBackgroundGradientKey(sectionId)]?.trim();
  const mode =
    rawMode === "image" || rawMode === "color" || rawMode === "gradient"
      ? rawMode
      : image
        ? "image"
        : gradient
          ? "gradient"
          : color
            ? "color"
            : null;
  if (!mode) {
    return {};
  }

  if (mode === "image") {
    if (!image) {
      return {};
    }

    const rawZoom = Number.parseFloat(
      textMap[getSectionBackgroundZoomKey(sectionId)] ?? "",
    );
    const zoom = Number.isFinite(rawZoom)
      ? Math.min(3, Math.max(1, rawZoom))
      : 1;
    const rawPositionX = Number.parseFloat(
      textMap[getSectionBackgroundPositionXKey(sectionId)] ?? "",
    );
    const positionX = Number.isFinite(rawPositionX)
      ? Math.min(100, Math.max(0, rawPositionX))
      : 50;
    const rawPositionY = Number.parseFloat(
      textMap[getSectionBackgroundPositionYKey(sectionId)] ?? "",
    );
    const positionY = Number.isFinite(rawPositionY)
      ? Math.min(100, Math.max(0, rawPositionY))
      : 50;

    return {
      backgroundImage: `url("${image}")`,
      backgroundSize: "cover",
      backgroundPosition: `${positionX}% ${positionY}%`,
      backgroundRepeat: "no-repeat",
      transform: zoom === 1 ? undefined : `scale(${zoom})`,
      transformOrigin: `${positionX}% ${positionY}%`,
    };
  }

  if (mode === "color") {
    if (!color) {
      return {};
    }

    return {
      backgroundColor: color,
    };
  }

  if (mode === "gradient") {
    if (!gradient) {
      return {};
    }

    return {
      backgroundImage: gradient,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }

  return {};
}

export function hasBackgroundImageLayer(style: CSSProperties) {
  return (
    typeof style.backgroundImage === "string" &&
    style.backgroundImage.length > 0
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getSectionBorderStyle(
  textMap: LandingTextMap,
  sectionId: string,
): CSSProperties {
  const widthRaw = textMap[getSectionBorderWidthKey(sectionId)];
  const colorRaw = textMap[getSectionBorderColorKey(sectionId)]?.trim();
  const radiusRaw = textMap[getSectionBorderRadiusKey(sectionId)];
  const styleRaw = textMap[getSectionBorderStyleKey(sectionId)]?.trim();

  const hasAnyValue =
    widthRaw != null || colorRaw != null || radiusRaw != null || styleRaw != null;
  if (!hasAnyValue) {
    return {};
  }

  const parsedWidth = Number.parseFloat(widthRaw ?? "");
  const width = Number.isFinite(parsedWidth) ? clamp(parsedWidth, 0, 24) : 1;
  const parsedRadius = Number.parseFloat(radiusRaw ?? "");
  const radius = Number.isFinite(parsedRadius) ? clamp(parsedRadius, 0, 120) : 0;
  const style =
    styleRaw === "dashed" || styleRaw === "dotted" || styleRaw === "none"
      ? styleRaw
      : "solid";
  const color = colorRaw && colorRaw.length > 0 ? colorRaw : "#0000001a";

  return {
    borderStyle: style,
    borderColor: color,
    borderWidth: `${width}px`,
    borderRadius: radius > 0 ? `${radius}px` : undefined,
  };
}
