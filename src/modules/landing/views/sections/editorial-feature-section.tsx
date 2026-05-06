"use client";

import { cn } from "@/lib/utils";
import { getSectionFieldKey } from "@/modules/landing/config/landing-sections";
import {
  getLandingFieldMarginStyle,
  getLandingFieldPaddingStyle,
} from "@/modules/landing/types/landing-text";
import { SectionExtras } from "@/modules/landing/views/components/section-extras";
import { getFieldStyle, renderField, selectableClass } from "@/modules/landing/views/utils/field";
import {
  getSectionBackgroundStyle,
  getSectionBorderStyle,
  getSectionOrderMap,
  hasBackgroundImageLayer,
} from "@/modules/landing/views/utils/section-style";
import type { LandingSectionComponentProps } from "@/modules/landing/views/sections/types";

export function EditorialFeatureSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
  responsiveMode,
}: LandingSectionComponentProps) {
  const headerTitle = renderField(section, "header_title", "", 62, textMap, responsiveMode);
  const kicker = renderField(section, "kicker", "", 20, textMap, responsiveMode);
  const title = renderField(section, "title", "", 56, textMap, responsiveMode);
  const subtitle = renderField(section, "subtitle", "", 56, textMap, responsiveMode);
  const body = renderField(section, "body", "", 24, textMap, responsiveMode);
  const highlight = renderField(section, "highlight", "", 34, textMap, responsiveMode);
  const body2 = renderField(section, "body2", "", 24, textMap, responsiveMode);
  const image = renderField(section, "image", "/assets/img1.jpg", 14, textMap, responsiveMode);
  const headerBackground =
    textMap[getSectionFieldKey(section.id, "__header_background")]?.trim() ||
    "#ddd8ca";
  const imageSizeRaw = Number.parseFloat(
    textMap[getSectionFieldKey(section.id, "__image_size")] ?? "",
  );
  const imageSize = Number.isFinite(imageSizeRaw)
    ? Math.min(100, Math.max(30, imageSizeRaw))
    : 100;
  const sectionPaddingStyle = getLandingFieldPaddingStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionMarginStyle = getLandingFieldMarginStyle(
    textMap,
    getSectionFieldKey(section.id, "__section_padding"),
  );
  const sectionBackgroundStyle = getSectionBackgroundStyle(textMap, section.id);
  const sectionBorderStyle = getSectionBorderStyle(textMap, section.id);
  const hasImageLayer = hasBackgroundImageLayer(sectionBackgroundStyle);
  const sectionStyle = hasImageLayer
    ? sectionBorderStyle
    : { ...sectionBackgroundStyle, ...sectionBorderStyle, ...sectionMarginStyle };
  const orderMap = getSectionOrderMap(textMap, section.id);
  const bodyPaddingStyle = {
    paddingLeft: "var(--landing-body-padding-x, 24px)",
    paddingRight: "var(--landing-body-padding-x, 24px)",
    ...sectionPaddingStyle,
  };

  return (
    <section
      className="relative isolate overflow-hidden"
      style={hasImageLayer ? { ...sectionStyle, ...sectionMarginStyle } : sectionStyle}
    >
      {hasImageLayer ? (
        <div aria-hidden className="absolute inset-0 -z-10" style={sectionBackgroundStyle} />
      ) : null}
      <div className="py-16" style={{ backgroundColor: headerBackground }}>
        <div className="mx-auto w-full max-w-[92rem]" style={bodyPaddingStyle}>
          <h2
            className={cn(
              "mx-auto max-w-4xl text-center leading-tight italic",
              selectableClass(selectedFieldId === headerTitle.key, previewMode),
            )}
            onClick={() => onSelectField?.(headerTitle.key)}
            style={getFieldStyle(headerTitle)}
          >
            {headerTitle.value}
          </h2>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[92rem] py-8" style={bodyPaddingStyle}>
        <div className="flex items-center">
          <p
            className={cn(
              "bg-[#e4ea97] px-4 py-2 tracking-wide uppercase",
              selectableClass(selectedFieldId === kicker.key, previewMode),
            )}
            onClick={() => onSelectField?.(kicker.key)}
            style={getFieldStyle(kicker)}
          >
            {kicker.value}
          </p>
        </div>

        <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h3
              className={cn(
                "leading-tight uppercase",
                selectableClass(selectedFieldId === title.key, previewMode),
              )}
              onClick={() => onSelectField?.(title.key)}
              style={getFieldStyle(title)}
            >
              {title.value}
            </h3>
            <p
              className={cn(
                "leading-tight italic",
                selectableClass(selectedFieldId === subtitle.key, previewMode),
              )}
              onClick={() => onSelectField?.(subtitle.key)}
              style={getFieldStyle(subtitle)}
            >
              {subtitle.value}
            </p>
            <p
              className={cn(
                "mt-6 text-black/80",
                selectableClass(selectedFieldId === body.key, previewMode),
              )}
              onClick={() => onSelectField?.(body.key)}
              style={getFieldStyle(body)}
            >
              {body.value}
            </p>
            <p
              className={cn(
                "mt-5 text-black/90",
                selectableClass(selectedFieldId === highlight.key, previewMode),
              )}
              onClick={() => onSelectField?.(highlight.key)}
              style={getFieldStyle(highlight)}
            >
              {highlight.value}
            </p>
            <p
              className={cn(
                "mt-5 text-black/80",
                selectableClass(selectedFieldId === body2.key, previewMode),
              )}
              onClick={() => onSelectField?.(body2.key)}
              style={getFieldStyle(body2)}
            >
              {body2.value}
            </p>
          </div>
          <div
            className={cn(
              "relative aspect-square w-full self-end overflow-hidden bg-black/5",
              selectableClass(selectedFieldId === image.key, previewMode),
            )}
            onClick={() => onSelectField?.(image.key)}
            style={{
              order: orderMap.get(`base:${image.key.split(".").pop() ?? ""}`) ?? undefined,
              width: `${imageSize}%`,
              marginLeft: "auto",
            }}
          >
            <img src={image.value} alt={title.value} className="h-full w-full object-cover" />
          </div>
        </div>
        <SectionExtras
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          responsiveMode={responsiveMode}
          orderMap={orderMap}
        />
      </div>
    </section>
  );
}
