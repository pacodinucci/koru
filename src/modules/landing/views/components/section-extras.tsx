"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  getSectionExtraPositionXKey,
  getSectionExtraPositionYKey,
  getSectionExtraResponsivePositionXKey,
  getSectionExtraResponsivePositionYKey,
  getSectionExtraTextKey,
  parseSectionExtraElements,
  type SectionExtraElementType,
} from "@/modules/landing/config/landing-sections";
import {
  getLandingFieldBackgroundColor,
  getLandingFieldButtonVariant,
  getLandingFieldBorderColor,
  getLandingFieldBorderRadius,
  getLandingFieldBorderStyle,
  getLandingFieldBorderWidth,
  getLandingFieldColor,
  getLandingFieldFontFamily,
  getLandingFieldLineWidth,
  getLandingFieldFontSize,
  getLandingFieldFontWeight,
  getLandingFieldMarginStyle,
  getLandingFieldPaddingStyle,
  getLandingFieldResponsiveSizeKey,
  getResponsiveModeFromWidth,
  type LandingPreviewBindings,
  type LandingResponsiveMode,
  type LandingTextMap,
} from "@/modules/landing/types/landing-text";
import { getFieldStyle, selectableClass } from "@/modules/landing/views/utils/field";
import { getOrder } from "@/modules/landing/views/utils/section-style";
import type { LandingSectionInstance } from "@/modules/landing/config/landing-sections";

function getExtraDefault(type: SectionExtraElementType) {
  switch (type) {
    case "title":
      return { text: "Nuevo titulo", size: 34 };
    case "button":
      return { text: "Nuevo boton", size: 14 };
    case "image":
      return { text: "/assets/img1.jpg", size: 320 };
    case "line-vertical":
      return { text: "", size: 120 };
    case "line-horizontal":
      return { text: "", size: 240 };
    case "text":
    default:
      return { text: "Nuevo texto", size: 18 };
  }
}

type SectionExtrasProps = {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
  orderMap?: Map<string, number>;
} & LandingPreviewBindings;

export function SectionExtras({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
  responsiveMode,
  onMoveSectionExtraPosition,
  orderMap,
}: SectionExtrasProps) {
  const extras = parseSectionExtraElements(textMap, section.id);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const RESPONSIVE_BASE_WIDTH = 1200;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || section.type !== "footer") {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(container.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    window.addEventListener("resize", updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, [section.type]);

  const footerResponsiveScale = 1;
  const footerTextResponsiveScale =
    section.type === "footer"
      ? Math.min(1, Math.max(0.18, containerWidth / RESPONSIVE_BASE_WIDTH))
      : 1;
  const isFooterNarrowLayout = false;
  const activeResponsiveMode: LandingResponsiveMode =
    responsiveMode ?? getResponsiveModeFromWidth(containerWidth);

  if (extras.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        section.type === "footer"
          ? isFooterNarrowLayout
            ? "flex flex-col gap-3"
            : "relative min-h-[220px]"
          : "mt-8 space-y-4",
      )}
    >
      {extras
        .slice()
        .sort(
          (a, b) =>
            getOrder(
              orderMap ?? new Map(),
              `extra:${a.id}`,
              Number.MAX_SAFE_INTEGER,
            ) -
            getOrder(
              orderMap ?? new Map(),
              `extra:${b.id}`,
              Number.MAX_SAFE_INTEGER,
            ),
        )
        .map((extra) => {
          const key = getSectionExtraTextKey(section.id, extra.id);
          const defaults = getExtraDefault(extra.type);
          const responsiveSizeRaw = textMap[
            getLandingFieldResponsiveSizeKey(key, activeResponsiveMode)
          ];
          const parsedResponsiveSize = Number(responsiveSizeRaw);
          const resolvedFontSize = Number.isFinite(parsedResponsiveSize)
            ? Math.min(800, Math.max(10, parsedResponsiveSize))
            : getLandingFieldFontSize(
                textMap,
                key,
                defaults.size,
                activeResponsiveMode,
              );
          const order = getOrder(
            orderMap ?? new Map(),
            `extra:${extra.id}`,
            999,
          );
          const field = {
            key,
            value: textMap[key] ?? defaults.text,
            fontSize: resolvedFontSize,
            color: getLandingFieldColor(textMap, key),
            fontFamily: getLandingFieldFontFamily(textMap, key),
            fontWeight: getLandingFieldFontWeight(textMap, key),
            marginStyle: getLandingFieldMarginStyle(textMap, key),
            paddingStyle: getLandingFieldPaddingStyle(textMap, key),
          };
          const positionXKey = getSectionExtraPositionXKey(section.id, extra.id);
          const positionYKey = getSectionExtraPositionYKey(section.id, extra.id);
          const responsivePositionXKey = getSectionExtraResponsivePositionXKey(
            section.id,
            extra.id,
            activeResponsiveMode,
          );
          const responsivePositionYKey = getSectionExtraResponsivePositionYKey(
            section.id,
            extra.id,
            activeResponsiveMode,
          );
          const positionX = Number.parseInt(
            textMap[responsivePositionXKey] ?? textMap[positionXKey] ?? "50",
            10,
          );
          const positionY = Number.parseInt(
            textMap[responsivePositionYKey] ?? textMap[positionYKey] ?? "50",
            10,
          );
          const clampedX = Number.isFinite(positionX)
            ? Math.min(100, Math.max(0, positionX))
            : 50;
          const clampedY = Number.isFinite(positionY)
            ? Math.min(100, Math.max(0, positionY))
            : 50;
          const shouldScaleElementWithTransform =
            section.type === "footer" &&
            !isFooterNarrowLayout &&
            extra.type !== "text";
          const positionedStyle: CSSProperties =
            section.type === "footer"
              ? isFooterNarrowLayout
                ? {
                    position: "relative",
                    left: 0,
                    top: 0,
                    transform: "none",
                    alignSelf: "flex-start",
                    marginLeft: 0,
                    maxWidth: "100%",
                  }
                : {
                    position: "absolute",
                    left: `${clampedX}%`,
                    top: `${clampedY}%`,
                    transform:
                      shouldScaleElementWithTransform && footerResponsiveScale < 1
                        ? `translate(-50%, -50%) scale(${footerResponsiveScale})`
                        : "translate(-50%, -50%)",
                    transformOrigin: "center center",
                  }
              : {};
          const responsiveFooterTextStyle: CSSProperties =
            section.type === "footer" && extra.type === "text"
              ? {
                  fontSize: `${Math.max(
                    12,
                    Math.round(field.fontSize * footerTextResponsiveScale),
                  )}px`,
                  lineHeight: 1.15,
                  maxWidth: isFooterNarrowLayout
                    ? "100%"
                    : `${Math.max(140, Math.round(containerWidth * 0.9))}px`,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }
              : {};
          const isDraggableInPreview =
            previewMode && section.type === "footer" && !isFooterNarrowLayout;
          const extraTextKey = getSectionExtraTextKey(section.id, extra.id);

          const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
            if (!isDraggableInPreview || !onMoveSectionExtraPosition) {
              return;
            }

            const container = containerRef.current;
            if (!container) {
              return;
            }

            event.preventDefault();
            onSelectField?.(extraTextKey);

            const target = event.currentTarget;
            const targetRect = target.getBoundingClientRect();
            const centerX = targetRect.left + targetRect.width / 2;
            const centerY = targetRect.top + targetRect.height / 2;
            const pointerOffsetX = event.clientX - centerX;
            const pointerOffsetY = event.clientY - centerY;

            const updateFromPointer = (clientX: number, clientY: number) => {
              const rect = container.getBoundingClientRect();
              if (rect.width <= 0 || rect.height <= 0) {
                return;
              }

              const centerWithinContainerX =
                clientX - rect.left - pointerOffsetX;
              const centerWithinContainerY =
                clientY - rect.top - pointerOffsetY;
              const nextX = Math.min(
                100,
                Math.max(0, (centerWithinContainerX / rect.width) * 100),
              );
              const nextY = Math.min(
                100,
                Math.max(0, (centerWithinContainerY / rect.height) * 100),
              );

              onMoveSectionExtraPosition(
                section.id,
                extra.id,
                Math.round(nextX),
                Math.round(nextY),
                activeResponsiveMode,
              );
            };

            const handlePointerMove = (moveEvent: PointerEvent) => {
              updateFromPointer(moveEvent.clientX, moveEvent.clientY);
            };

            const stopDragging = () => {
              window.removeEventListener("pointermove", handlePointerMove);
              window.removeEventListener("pointerup", stopDragging);
              window.removeEventListener("pointercancel", stopDragging);
            };

            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", stopDragging, { once: true });
            window.addEventListener("pointercancel", stopDragging, {
              once: true,
            });
          };

          if (extra.type === "title") {
            return (
              <h3
                key={extra.id}
                className={cn(
                  "font-semibold tracking-tight",
                  isDraggableInPreview && "cursor-grab active:cursor-grabbing",
                  selectableClass(selectedFieldId === field.key, previewMode),
                )}
                onClick={() => onSelectField?.(field.key)}
                onPointerDown={handlePointerDown}
                style={{ ...getFieldStyle(field), ...positionedStyle, order }}
              >
                {field.value}
              </h3>
            );
          }

          if (extra.type === "button") {
            const buttonVariant = getLandingFieldButtonVariant(textMap, key);
            const resolvedButtonVariant =
              buttonVariant === "custom" ? "default" : buttonVariant;
            const buttonBackgroundColor = getLandingFieldBackgroundColor(
              textMap,
              key,
            );
            const buttonBorderColor = getLandingFieldBorderColor(textMap, key);
            const buttonBorderWidth = getLandingFieldBorderWidth(textMap, key);
            const buttonBorderRadius = getLandingFieldBorderRadius(textMap, key);
            const buttonBorderStyle = getLandingFieldBorderStyle(textMap, key);
            return (
              <Button
                key={extra.id}
                type="button"
                variant={resolvedButtonVariant}
                size="lg"
                className={cn(
                  isDraggableInPreview && "cursor-grab active:cursor-grabbing",
                  selectableClass(selectedFieldId === field.key, previewMode),
                )}
                style={{
                  ...(buttonVariant === "custom" ? getFieldStyle(field) : null),
                  ...positionedStyle,
                  order,
                  ...(buttonVariant === "custom" && buttonBackgroundColor
                    ? { backgroundColor: buttonBackgroundColor }
                    : null),
                  ...(buttonVariant === "custom" && buttonBorderColor
                    ? { borderColor: buttonBorderColor }
                    : null),
                  ...(buttonVariant === "custom" && buttonBorderWidth != null
                    ? { borderWidth: `${buttonBorderWidth}px` }
                    : null),
                  ...(buttonVariant === "custom" && buttonBorderRadius != null
                    ? { borderRadius: `${buttonBorderRadius}px` }
                    : null),
                  ...(buttonVariant === "custom" && buttonBorderStyle
                    ? { borderStyle: buttonBorderStyle }
                    : null),
                }}
                onClick={() => onSelectField?.(field.key)}
                onPointerDown={handlePointerDown}
              >
                {field.value}
              </Button>
            );
          }

          if (extra.type === "image") {
            const imageSrc = field.value.trim();
            return (
              <div
                key={extra.id}
                className={cn(
                  "overflow-hidden rounded-md border border-black/10",
                  isDraggableInPreview && "cursor-grab active:cursor-grabbing",
                  selectableClass(selectedFieldId === field.key, previewMode),
                )}
                onClick={() => onSelectField?.(field.key)}
                onPointerDown={handlePointerDown}
                style={{
                  order,
                  ...positionedStyle,
                  width: `${Math.max(80, field.fontSize)}px`,
                  maxWidth: "100%",
                }}
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt=""
                    className="block h-auto w-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
                    Sin imagen
                  </div>
                )}
              </div>
            );
          }

          if (extra.type === "line-vertical") {
            const lineWidth = getLandingFieldLineWidth(textMap, key, 1);
            return (
              <div
                key={extra.id}
                className={cn(
                  isDraggableInPreview && "cursor-grab active:cursor-grabbing",
                  selectableClass(selectedFieldId === field.key, previewMode),
                )}
                onClick={() => onSelectField?.(field.key)}
                onPointerDown={handlePointerDown}
                style={{
                  ...getFieldStyle(field),
                  ...positionedStyle,
                  order,
                  width: `${lineWidth}px`,
                  minWidth: `${lineWidth}px`,
                  height: `${Math.max(24, field.fontSize)}px`,
                  backgroundColor: field.color ?? "#111827",
                }}
              />
            );
          }

          if (extra.type === "line-horizontal") {
            const lineWidth = getLandingFieldLineWidth(textMap, key, 1);
            return (
              <div
                key={extra.id}
                className={cn(
                  isDraggableInPreview && "cursor-grab active:cursor-grabbing",
                  selectableClass(selectedFieldId === field.key, previewMode),
                )}
                onClick={() => onSelectField?.(field.key)}
                onPointerDown={handlePointerDown}
                style={{
                  ...getFieldStyle(field),
                  ...positionedStyle,
                  order,
                  width: `${Math.max(24, field.fontSize)}px`,
                  maxWidth: "100%",
                  height: `${lineWidth}px`,
                  backgroundColor: field.color ?? "#111827",
                }}
              />
            );
          }

          return (
            <p
              key={extra.id}
              className={cn(
                section.type === "footer" ? "text-black/75" : "leading-7 text-black/75",
                isDraggableInPreview && "cursor-grab active:cursor-grabbing",
                selectableClass(selectedFieldId === field.key, previewMode),
              )}
              onClick={() => onSelectField?.(field.key)}
              onPointerDown={handlePointerDown}
              style={{
                ...getFieldStyle(field),
                ...responsiveFooterTextStyle,
                ...positionedStyle,
                order,
              }}
            >
              {field.value}
            </p>
          );
        })}
    </div>
  );
}
