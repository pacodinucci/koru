import { useId, type SVGProps } from "react";

import { cn } from "@/lib/utils";

type SporeShapeProps = SVGProps<SVGSVGElement> & {
  color?: string;
  opacity?: number;
  flipX?: boolean;
  flipY?: boolean;
  rotate?: number;
  size?: number | string;
};

const VIEWBOX_WIDTH = 439;
const VIEWBOX_HEIGHT = 396;
const CENTER_X = VIEWBOX_WIDTH / 2;
const CENTER_Y = VIEWBOX_HEIGHT / 2;
const SOURCE_PATH = "/assets/spore-shape-source.svg";

function getResponsiveSizeFromLevel(level: number) {
  const safeLevel = Math.max(1, level);
  const minPx = 70 + safeLevel * 20;
  const vw = 8 + safeLevel * 2;
  const maxPx = 140 + safeLevel * 60;
  return `clamp(${minPx}px,${vw}vw,${maxPx}px)`;
}

export function SporeShape({
  color,
  opacity = 1,
  flipX = false,
  flipY = false,
  rotate = 0,
  size,
  className,
  style,
  width,
  height,
  ...props
}: SporeShapeProps) {
  const safeOpacity = Math.min(1, Math.max(0, opacity));
  const rawId = useId();
  const maskId = `spore-shape-mask-${rawId.replace(/:/g, "")}`;
  const resolvedSize =
    typeof size === "number" ? getResponsiveSizeFromLevel(size) : size;
  const flipTransform = `translate(${flipX ? VIEWBOX_WIDTH : 0} ${
    flipY ? VIEWBOX_HEIGHT : 0
  }) scale(${flipX ? -1 : 1} ${flipY ? -1 : 1})`;

  const resolvedStyle =
    resolvedSize !== undefined && width === undefined && height === undefined
      ? { width: resolvedSize, height: "auto", ...style }
      : style;

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block", className)}
      fill="none"
      aria-hidden="true"
      width={width}
      height={height}
      style={resolvedStyle}
      {...props}
    >
      <defs>
        <mask
          id={maskId}
          x="0"
          y="0"
          width={VIEWBOX_WIDTH}
          height={VIEWBOX_HEIGHT}
          maskUnits="userSpaceOnUse"
        >
          <image href={SOURCE_PATH} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} />
        </mask>
      </defs>
      <g transform={`rotate(${rotate} ${CENTER_X} ${CENTER_Y})`}>
        <g transform={flipTransform}>
          {color ? (
            <rect
              width={VIEWBOX_WIDTH}
              height={VIEWBOX_HEIGHT}
              fill={color}
              fillOpacity={safeOpacity}
              mask={`url(#${maskId})`}
            />
          ) : (
            <image
              href={SOURCE_PATH}
              width={VIEWBOX_WIDTH}
              height={VIEWBOX_HEIGHT}
              opacity={safeOpacity}
            />
          )}
        </g>
      </g>
    </svg>
  );
}

export type { SporeShapeProps };
