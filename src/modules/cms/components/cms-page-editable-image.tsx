"use client";

import Image, { type ImageProps } from "next/image";
import {
  createContext,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";

import type {
  CmsImageMap,
  CmsImageValue,
} from "@/modules/cms/server/cms-image.repository";

type CmsImageAdjustmentContextValue = {
  adjustingSlotId: string | null;
  onCommitCrop: (slotId: string, value: CmsImageValue) => void;
};

const CmsImageAdjustmentContext =
  createContext<CmsImageAdjustmentContextValue | null>(null);

export function CmsImageAdjustmentProvider({
  adjustingSlotId,
  onCommitCrop,
  children,
}: CmsImageAdjustmentContextValue & { children: ReactNode }) {
  return (
    <CmsImageAdjustmentContext.Provider
      value={{ adjustingSlotId, onCommitCrop }}
    >
      {children}
    </CmsImageAdjustmentContext.Provider>
  );
}

type CmsPageEditableImageProps = Omit<ImageProps, "src" | "alt" | "ref"> & {
  slotId: string;
  defaultSrc: string;
  alt: string;
  imageMap?: CmsImageMap;
  previewMode?: boolean;
  selectedContentSlotId?: string | null;
  onSelectContentSlot?: (slotId: string) => void;
};

export function CmsPageEditableImage({
  slotId,
  defaultSrc,
  alt,
  imageMap = {},
  previewMode = false,
  selectedContentSlotId,
  onSelectContentSlot,
  style,
  fill,
  ...imageProps
}: CmsPageEditableImageProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const panCleanupRef = useRef<(() => void) | null>(null);
  const adjustment = useContext(CmsImageAdjustmentContext);
  const value = imageMap[slotId];
  const src = value?.url || defaultSrc;
  const cropX = value?.cropX ?? 50;
  const cropY = value?.cropY ?? 50;
  const zoom = value?.zoom ?? 1;
  const fitMode = value?.fitMode ?? "COVER";
  const rotation = value?.rotation ?? 0;
  const panFactor = (zoom - 1) / zoom;
  const translateX = ((50 - cropX) / 100) * panFactor * 100;
  const translateY = ((50 - cropY) / 100) * panFactor * 100;
  useEffect(() => {
    if (!imageRef.current) return;
    const frame = imageRef.current.parentElement;
    if (!frame) return;

    const previous = {
      aspectRatio: frame.style.aspectRatio,
      borderRadius: frame.style.borderRadius,
      clipPath: frame.style.clipPath,
      overflow: frame.style.overflow,
    };
    const frameShape = value?.frameShape ?? "RECTANGULAR";

    if (value?.frameSize === "COMPACT") frame.style.aspectRatio = "1 / 1";
    if (value?.frameSize === "LARGE") frame.style.aspectRatio = "3 / 5";

    if (frameShape === "RECTANGLE_HORIZONTAL") {
      frame.style.aspectRatio = "4 / 3";
      frame.style.borderRadius = "0";
    }
    if (frameShape === "RECTANGLE_VERTICAL") {
      frame.style.aspectRatio = "4 / 5";
      frame.style.borderRadius = "0";
    }
    if (frameShape === "SQUARE") {
      frame.style.aspectRatio = "1 / 1";
      frame.style.borderRadius = "0";
    }
    if (frameShape === "OVAL") {
      frame.style.aspectRatio = "4 / 5";
      frame.style.borderRadius = "50%";
    }
    if (frameShape === "CIRCLE") {
      frame.style.aspectRatio = "1 / 1";
      frame.style.borderRadius = "50%";
    }
    if (frameShape === "IRREGULAR") {
      frame.style.aspectRatio = "4 / 5";
      frame.style.borderRadius = "44% 56% 47% 53% / 53% 45% 55% 47%";
    }
    if (frameShape !== "RECTANGULAR") frame.style.overflow = "hidden";

    return () => {
      frame.style.aspectRatio = previous.aspectRatio;
      frame.style.borderRadius = previous.borderRadius;
      frame.style.clipPath = previous.clipPath;
      frame.style.overflow = previous.overflow;
    };
  }, [value?.frameShape, value?.frameSize]);

  useEffect(() => () => panCleanupRef.current?.(), []);

  const selected = previewMode && selectedContentSlotId === slotId;
  const isAdjusting =
    previewMode &&
    selected &&
    adjustment?.adjustingSlotId === slotId &&
    Boolean(value);

  function startImagePan(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!isAdjusting || !value || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const image = imageRef.current;
    if (!image) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const frame = image.parentElement;
    if (!frame) return;
    const frameRect = frame.getBoundingClientRect();
    const baseWidth = image.offsetWidth || frameRect.width;
    const baseHeight = image.offsetHeight || frameRect.height;
    const overflowX = Math.max(0, baseWidth * zoom - frameRect.width);
    const overflowY = Math.max(0, baseHeight * zoom - frameRect.height);
    let nextX = cropX;
    let nextY = cropY;

    const clamp = (position: number) => Math.max(0, Math.min(100, position));
    const move = (moveEvent: PointerEvent) => {
      nextX =
        overflowX > 0
          ? clamp(cropX - ((moveEvent.clientX - startX) / overflowX) * 100)
          : 50;
      nextY =
        overflowY > 0
          ? clamp(cropY - ((moveEvent.clientY - startY) / overflowY) * 100)
          : 50;
      image.style.objectPosition = `${nextX.toFixed(3)}% ${nextY.toFixed(3)}%`;
    };
    const cleanup = () => {
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cleanup);
      panCleanupRef.current = null;
    };
    const up = () => {
      cleanup();
      if (Math.abs(nextX - cropX) < 0.01 && Math.abs(nextY - cropY) < 0.01) return;
      adjustment?.onCommitCrop(slotId, {
        ...value,
        cropX: nextX,
        cropY: nextY,
      });
    };

    panCleanupRef.current?.();
    panCleanupRef.current = cleanup;
    document.body.style.cursor = "grabbing";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cleanup);
  }

  return (
    <>
      <Image
        ref={imageRef}
        src={src}
        alt={alt}
        style={{
          ...style,
          objectPosition: `${cropX}% ${cropY}%`,
          objectFit: fitMode.toLowerCase() as "cover" | "contain",
          transform: `translate3d(${translateX}%, ${translateY}%, 0) scale(${zoom}) rotate(${rotation}deg)`,
        }}
        data-cms-frame-size={value?.frameSize ?? "NORMAL"}
        fill={fill}
        {...imageProps}
      />
      {previewMode ? (
        <button
          type="button"
          data-content-slot-id={slotId}
          onPointerDown={startImagePan}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!isAdjusting) {
              onSelectContentSlot?.(slotId);
            }
          }}
          className={`absolute inset-0 z-20 rounded-[inherit] bg-transparent transition focus-visible:outline-none ${
            isAdjusting
              ? "cursor-grab shadow-[inset_0_0_0_5px_rgb(16_185_129)] active:cursor-grabbing"
              : selected
                ? "cursor-pointer shadow-[inset_0_0_0_5px_rgb(16_185_129)]"
                : "cursor-pointer hover:shadow-[inset_0_0_0_4px_rgb(110_231_183)] focus-visible:shadow-[inset_0_0_0_4px_rgb(16_185_129)]"
          }`}
          aria-label={
            isAdjusting
              ? `Ajustar encuadre: ${alt}`
              : `Editar imagen: ${alt}`
          }
          aria-pressed={selected}
        />
      ) : null}
    </>
  );
}
