"use client";

import type { CSSProperties } from "react";
import { SectionExtras } from "@/modules/landing/views/components/section-extras";
import { getSectionFieldKey } from "@/modules/landing/config/landing-sections";
import { getLandingFieldPaddingStyle } from "@/modules/landing/types/landing-text";
import { getSectionBackgroundStyle } from "@/modules/landing/views/utils/section-style";
import type { LandingSectionComponentProps } from "@/modules/landing/views/sections/types";

export function VideoSection({
  section,
  textMap,
  previewMode,
}: LandingSectionComponentProps) {
  const videoUrlKey = getSectionFieldKey(section.id, "url");
  const videoOverlayOpacityKey = getSectionFieldKey(
    section.id,
    "__video_overlay_opacity",
  );
  const videoPositionXKey = getSectionFieldKey(section.id, "__video_position_x");
  const videoPositionYKey = getSectionFieldKey(section.id, "__video_position_y");
  const videoZoomKey = getSectionFieldKey(section.id, "__video_zoom");
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
  const zoom = Number.isFinite(zoomRaw) ? Math.min(300, Math.max(100, zoomRaw)) : 100;

  const sectionBackgroundStyle = getSectionBackgroundStyle(textMap, section.id);
  const sectionPaddingStyle = getLandingFieldPaddingStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionStyle: CSSProperties = {
    ...sectionBackgroundStyle,
    ...sectionPaddingStyle,
    transform: undefined,
    transformOrigin: undefined,
    minHeight: "100vh",
    boxSizing: "border-box",
  };

  return (
    <section
      className="relative isolate w-full overflow-hidden"
      style={sectionStyle}
    >
      <div className="relative h-screen w-full">
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
      </div>
      <SectionExtras
        section={section}
        textMap={textMap}
        previewMode={previewMode}
      />
    </section>
  );
}
