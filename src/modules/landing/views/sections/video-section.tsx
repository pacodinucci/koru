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
  const configuredVideo = textMap[videoUrlKey]?.trim() ?? "";
  const videoSrc = configuredVideo.endsWith(".mp4")
    ? configuredVideo
    : "/assets/vid2.mp4";

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
          className="block h-full w-full object-cover"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          controls={previewMode}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-black/40"
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
