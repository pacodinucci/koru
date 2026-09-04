"use client";

import Image, { type ImageProps } from "next/image";
import {
  createContext,
  type MouseEvent as ReactMouseEvent,
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
  const adjustment = useContext(CmsImageAdjustmentContext);
  const value = imageMap[slotId];
  const src = value?.url || defaultSrc;
  const cropX = value?.cropX ?? 50;
  const cropY = value?.cropY ?? 50;
  const zoom = value?.zoom ?? 1;
  const fitMode = value?.fitMode ?? "COVER";
  useEffect(() => {
    if (!fill || !imageRef.current) return;
    const frame = imageRef.current.parentElement;
    if (!frame) return;
    const previousAspectRatio = frame.style.aspectRatio;
    if (value?.frameSize === "COMPACT") frame.style.aspectRatio = "1 / 1";
    if (value?.frameSize === "LARGE") frame.style.aspectRatio = "3 / 5";
    return () => { frame.style.aspectRatio = previousAspectRatio; };
  }, [fill, value?.frameSize]);

  const selected = previewMode && selectedContentSlotId === slotId;
  const isAdjusting =
    previewMode &&
    selected &&
    adjustment?.adjustingSlotId === slotId &&
    Boolean(value);

  function startImagePan(event: ReactMouseEvent<HTMLButtonElement>) {
    if (!isAdjusting || !value) {
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
    const rect = image.getBoundingClientRect();
    const naturalWidth = image.naturalWidth || rect.width;
    const naturalHeight = image.naturalHeight || rect.height;
    const scale = Math.max(
      rect.width / naturalWidth,
      rect.height / naturalHeight,
    );
    const overflowX = Math.max(0, naturalWidth * scale * zoom - rect.width);
    const overflowY = Math.max(0, naturalHeight * scale * zoom - rect.height);
    let nextX = cropX;
    let nextY = cropY;

    const clamp = (position: number) => Math.max(0, Math.min(100, position));
    const move = (moveEvent: MouseEvent) => {
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
    const up = () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      adjustment?.onCommitCrop(slotId, {
        ...value,
        cropX: nextX,
        cropY: nextY,
      });
    };

    document.body.style.cursor = "grabbing";
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
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
          transform: `scale(${zoom})`,
        }}
        data-cms-frame-size={value?.frameSize ?? "NORMAL"}
        fill={fill}
        {...imageProps}
      />
      {previewMode ? (
        <button
          type="button"
          data-content-slot-id={slotId}
          onMouseDown={startImagePan}
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
