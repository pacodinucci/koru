"use client";

import type { CSSProperties } from "react";
import { SectionExtras } from "@/modules/landing/views/components/section-extras";
import { getSectionFieldKey } from "@/modules/landing/config/landing-sections";
import { getLandingFieldPaddingStyle } from "@/modules/landing/types/landing-text";
import {
  getSectionBackgroundStyle,
  getSectionBorderStyle,
} from "@/modules/landing/views/utils/section-style";
import type { LandingSectionComponentProps } from "@/modules/landing/views/sections/types";

function getVideoTextItemsKey(sectionId: string) {
  return getSectionFieldKey(sectionId, "__video_text_items");
}

function getVideoTextFieldKey(
  sectionId: string,
  textId: string,
  field:
    | "content"
    | "size"
    | "color"
    | "weight"
    | "align"
    | "position_x"
    | "position_y",
) {
  return getSectionFieldKey(sectionId, `__video_text_${textId}_${field}`);
}

function parseVideoTextItems(
  textMap: Record<string, string>,
  sectionId: string,
) {
  const raw = textMap[getVideoTextItemsKey(sectionId)];
  if (!raw) {
    return [] as string[];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [] as string[];
    }
    return parsed.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  } catch {
    return [] as string[];
  }
}

export function VideoSection({
  section,
  textMap,
  previewMode,
  responsiveMode,
}: LandingSectionComponentProps) {
  const videoUrlKey = getSectionFieldKey(section.id, "url");
  const videoOverlayOpacityKey = getSectionFieldKey(
    section.id,
    "__video_overlay_opacity",
  );
  const videoPositionXKey = getSectionFieldKey(
    section.id,
    "__video_position_x",
  );
  const videoPositionYKey = getSectionFieldKey(
    section.id,
    "__video_position_y",
  );
  const videoZoomKey = getSectionFieldKey(section.id, "__video_zoom");
  const sectionHeightKey = getSectionFieldKey(section.id, "__section_height");
  const configuredVideo = textMap[videoUrlKey]?.trim() ?? "";
  const videoSrc = /\.mp4$/i.test(configuredVideo)
    ? configuredVideo
    : "/assets/vid2.mp4";
  const overlayOpacityRaw = Number.parseInt(
    textMap[videoOverlayOpacityKey] ?? "",
    10,
  );
  const overlayOpacity = Number.isFinite(overlayOpacityRaw)
    ? Math.min(100, Math.max(0, overlayOpacityRaw))
    : 40;
  const positionXRaw = Number.parseInt(textMap[videoPositionXKey] ?? "", 10);
  const positionYRaw = Number.parseInt(textMap[videoPositionYKey] ?? "", 10);
  const zoomRaw = Number.parseInt(textMap[videoZoomKey] ?? "", 10);
  const positionX = Number.isFinite(positionXRaw)
    ? Math.min(100, Math.max(0, positionXRaw))
    : 50;
  const positionY = Number.isFinite(positionYRaw)
    ? Math.min(100, Math.max(0, positionYRaw))
    : 50;
  const zoom = Number.isFinite(zoomRaw)
    ? Math.min(300, Math.max(100, zoomRaw))
    : 100;
  const heightRaw = Number.parseInt(
    textMap[sectionHeightKey] ?? textMap[getSectionFieldKey(section.id, "__video_height")] ?? "",
    10,
  );
  const heightVh = Number.isFinite(heightRaw)
    ? Math.min(300, Math.max(40, heightRaw))
    : 100;
  const sectionHeight = `calc(var(--landing-vh, 100dvh) * ${heightVh} / 100)`;
  const videoTextItems = parseVideoTextItems(textMap, section.id);

  const sectionBackgroundStyle = getSectionBackgroundStyle(textMap, section.id);
  const sectionBorderStyle = getSectionBorderStyle(textMap, section.id);
  const sectionPaddingStyle = getLandingFieldPaddingStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionStyle: CSSProperties = {
    ...sectionBackgroundStyle,
    ...sectionBorderStyle,
    ...sectionPaddingStyle,
    transform: undefined,
    transformOrigin: undefined,
    height: sectionHeight,
    boxSizing: "border-box",
  };

  return (
    <section
      className="relative isolate w-full overflow-hidden"
      style={sectionStyle}
    >
      <div className="relative w-full" style={{ height: sectionHeight }}>
        <video
          key={videoSrc}
          className="block h-full w-full object-cover"
          src={videoSrc}
          style={{
            objectPosition: `${positionX}% ${positionY}%`,
            transform: `scale(${zoom / 100})`,
          }}
          autoPlay
          muted
          loop
          playsInline
          controls={previewMode}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity / 100 }}
        />
        {videoTextItems.map((textId) => {
          const content =
            textMap[getVideoTextFieldKey(section.id, textId, "content")] ?? "";
          if (!content.trim()) {
            return null;
          }
          const sizeRaw = Number.parseInt(
            textMap[getVideoTextFieldKey(section.id, textId, "size")] ?? "",
            10,
          );
          const positionXRaw = Number.parseInt(
            textMap[getVideoTextFieldKey(section.id, textId, "position_x")] ??
              "",
            10,
          );
          const positionYRaw = Number.parseInt(
            textMap[getVideoTextFieldKey(section.id, textId, "position_y")] ??
              "",
            10,
          );
          const color =
            textMap[getVideoTextFieldKey(section.id, textId, "color")] ||
            "#ffffff";
          const weight =
            textMap[getVideoTextFieldKey(section.id, textId, "weight")] ||
            "700";
          const alignRaw =
            textMap[getVideoTextFieldKey(section.id, textId, "align")];
          const align =
            alignRaw === "left" || alignRaw === "right" || alignRaw === "center"
              ? alignRaw
              : "center";
          const size = Number.isFinite(sizeRaw)
            ? Math.min(120, Math.max(12, sizeRaw))
            : 44;
          const positionX = Number.isFinite(positionXRaw)
            ? Math.min(100, Math.max(0, positionXRaw))
            : 50;
          const positionY = Number.isFinite(positionYRaw)
            ? Math.min(100, Math.max(0, positionYRaw))
            : 50;

          return (
            <div
              key={textId}
              className="pointer-events-none absolute z-10 w-full max-w-[min(92vw,900px)] px-4"
              style={{
                left: `${positionX}%`,
                top: `${positionY}%`,
                transform: "translate(-50%, -50%)",
                textAlign: align,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color,
                  fontSize: `${size}px`,
                  fontWeight: Number.parseInt(weight, 10) || 700,
                  lineHeight: 1.1,
                  textShadow: "0 2px 14px rgba(0,0,0,0.45)",
                }}
              >
                {content}
              </p>
            </div>
          );
        })}
      </div>
      <SectionExtras
        section={section}
        textMap={textMap}
        previewMode={previewMode}
        responsiveMode={responsiveMode}
      />
    </section>
  );
}
