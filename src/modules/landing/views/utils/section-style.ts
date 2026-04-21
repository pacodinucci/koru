import type { LandingTextMap } from "@/modules/landing/types/landing-text";
import {
  getSectionBackgroundColorKey,
  getSectionBackgroundGradientKey,
  getSectionBackgroundImageKey,
  getSectionBackgroundModeKey,
  getSectionBackgroundPositionXKey,
  getSectionBackgroundPositionYKey,
  getSectionBackgroundZoomKey,
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
  const mode = textMap[getSectionBackgroundModeKey(sectionId)]?.trim();
  if (!mode) {
    return {};
  }

  if (mode === "image") {
    const image = textMap[getSectionBackgroundImageKey(sectionId)]?.trim();
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
    const color = textMap[getSectionBackgroundColorKey(sectionId)]?.trim();
    if (!color) {
      return {};
    }

    return {
      backgroundColor: color,
    };
  }

  if (mode === "gradient") {
    const gradient =
      textMap[getSectionBackgroundGradientKey(sectionId)]?.trim();
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

