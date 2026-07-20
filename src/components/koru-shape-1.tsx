import { useId, type CSSProperties, type SVGProps } from "react";

import { cn } from "@/lib/utils";

type KoruShape1Props = SVGProps<SVGSVGElement> & {
  color?: string;
  opacity?: number;
  size?: number | string;
  x?: number | string;
  y?: number | string;
  rotate?: number;
  flipX?: boolean;
  flipY?: boolean;
};

const VIEWBOX_WIDTH = 1104;
const VIEWBOX_HEIGHT = 1424;
const SOURCE_PATH = "/assets/koru-shape-1.svg";

function toUnit(value: number | string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "number" ? `${value}px` : value;
}

export function KoruShape1({
  color,
  opacity = 0.2,
  size = 220,
  x,
  y,
  rotate = 0,
  flipX = false,
  flipY = false,
  className,
  style,
  ...props
}: KoruShape1Props) {
  const safeOpacity = Math.min(1, Math.max(0, opacity));
  const resolvedX = toUnit(x);
  const resolvedY = toUnit(y);
  const resolvedSize = toUnit(size);
  const rawId = useId();
  const maskId = `koru-shape-1-mask-${rawId.replace(/:/g, "")}`;
  const transform = `rotate(${rotate}deg) scale(${flipX ? -1 : 1},${flipY ? -1 : 1})`;

  const resolvedStyle: CSSProperties = {
    position: "absolute",
    left: resolvedX,
    top: resolvedY,
    width: resolvedSize,
    opacity: safeOpacity,
    transform,
    height: "auto",
    ...style,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none", className)}
      style={resolvedStyle}
      fill="none"
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
          <image
            href={SOURCE_PATH}
            width={VIEWBOX_WIDTH}
            height={VIEWBOX_HEIGHT}
          />
        </mask>
      </defs>
      {color ? (
        <rect
          width={VIEWBOX_WIDTH}
          height={VIEWBOX_HEIGHT}
          fill={color}
          mask={`url(#${maskId})`}
        />
      ) : (
        <image
          href={SOURCE_PATH}
          width={VIEWBOX_WIDTH}
          height={VIEWBOX_HEIGHT}
        />
      )}
    </svg>
  );
}

export type { KoruShape1Props };
