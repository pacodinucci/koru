
"use client";

import { useEffect, useRef } from "react";
import { FernShape } from "@/components/fern-shape";

type ScrollFloatingFernsProps = {
  sectionId: string;
};

type FloatingFern = {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  rotate: number;
  driftX: number;
  driftY: number;
  spin: number;
  flipX?: boolean;
  flipY?: boolean;
};

const floatingFerns: FloatingFern[] = [
  { x: 10, y: 8, size: 70, color: "var(--complement-700)", opacity: 0.32, rotate: -18, driftX: 28, driftY: 70, spin: 24 },
  { x: 42, y: 5, size: 46, color: "var(--brand-600)", opacity: 0.26, rotate: 32, driftX: -34, driftY: 95, spin: -36, flipX: true },
  { x: 72, y: 12, size: 58, color: "var(--orange-500)", opacity: 0.3, rotate: 8, driftX: 18, driftY: 110, spin: 42 },
  { x: 20, y: 28, size: 42, color: "var(--complement-900)", opacity: 0.22, rotate: 88, driftX: 44, driftY: -60, spin: -28, flipY: true },
  { x: 58, y: 30, size: 82, color: "var(--complement-600)", opacity: 0.34, rotate: -42, driftX: -50, driftY: 84, spin: 18 },
  { x: 84, y: 38, size: 38, color: "var(--brand-500)", opacity: 0.22, rotate: 120, driftX: -22, driftY: -92, spin: -52 },
  { x: 8, y: 52, size: 54, color: "var(--orange-600)", opacity: 0.26, rotate: 18, driftX: 62, driftY: -82, spin: 36, flipX: true },
  { x: 38, y: 58, size: 34, color: "var(--complement-800)", opacity: 0.28, rotate: -96, driftX: -28, driftY: 76, spin: -18 },
  { x: 68, y: 62, size: 66, color: "var(--brand-700)", opacity: 0.2, rotate: 54, driftX: 36, driftY: -70, spin: 30, flipY: true },
  { x: 18, y: 78, size: 86, color: "var(--complement-700)", opacity: 0.24, rotate: 150, driftX: 30, driftY: -130, spin: -44 },
  { x: 52, y: 82, size: 48, color: "var(--orange-300)", opacity: 0.36, rotate: -8, driftX: -46, driftY: -88, spin: 48 },
  { x: 86, y: 78, size: 74, color: "var(--brand-300)", opacity: 0.34, rotate: 72, driftX: -64, driftY: -116, spin: -24, flipX: true },
];

function getScrollProgress(section: HTMLElement) {
  const rect = section.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 1;
  const total = rect.height - viewportHeight * 0.45;
  const travelled = viewportHeight * 0.35 - rect.top;

  if (total <= 0) {
    return 1;
  }

  return Math.min(1, Math.max(0, travelled / total));
}

export function ScrollFloatingFerns({ sectionId }: ScrollFloatingFernsProps) {
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const progressRef = useRef(0);

  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    let animationFrameId: number | null = null;
    let startTime: number | null = null;

    function animate(now: number, activeSection: HTMLElement) {
      startTime ??= now;
      const time = (now - startTime) / 1000;
      progressRef.current = getScrollProgress(activeSection);
      const scrollEase = progressRef.current * progressRef.current * (3 - 2 * progressRef.current);

      floatingFerns.forEach((fern, index) => {
        const node = itemRefs.current[index];
        if (!node) {
          return;
        }

        const wave = Math.sin(time * 0.55 + index * 0.9);
        const counterWave = Math.cos(time * 0.42 + index * 0.7);
        const x = fern.driftX * scrollEase * 0.55 + wave * 10;
        const y = fern.driftY * scrollEase * 0.55 + counterWave * 12;
        const rotation = fern.rotate + progressRef.current * fern.spin * 0.45 + wave * 7;

        node.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
      });

      animationFrameId = window.requestAnimationFrame((nextNow) =>
        animate(nextNow, activeSection),
      );
    }

    animationFrameId = window.requestAnimationFrame((now) =>
      animate(now, section),
    );

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [sectionId]);

  return (
    <div className="sticky top-28 min-h-[calc(100dvh-8rem)] overflow-hidden rounded-[2rem] bg-white">
      <div className="relative h-[calc(100dvh-8rem)] min-h-[36rem] w-full">
        {floatingFerns.map((fern, index) => (
          <div
            key={`${fern.x}-${fern.y}-${index}`}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            className="pointer-events-none absolute will-change-transform"
            style={{
              left: `${fern.x}%`,
              top: `${fern.y}%`,
              width: `${fern.size}px`,
            }}
          >
            <FernShape
              size="100%"
              color={fern.color}
              opacity={fern.opacity}
              rotate={0}
              flipX={fern.flipX}
              flipY={fern.flipY}
              style={{ position: "relative", width: "100%", height: "auto" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
