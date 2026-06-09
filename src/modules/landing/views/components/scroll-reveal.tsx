"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type ScrollRevealDirection =
  | "left"
  | "right"
  | "up"
  | "down"
  | "none";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  direction?: ScrollRevealDirection;
  delayMs?: number;
  threshold?: number;
  style?: CSSProperties;
};

const hiddenDirectionClass: Record<ScrollRevealDirection, string> = {
  left: "-translate-x-12 translate-y-0",
  right: "translate-x-12 translate-y-0",
  up: "translate-y-12 translate-x-0",
  down: "-translate-y-12 translate-x-0",
  none: "translate-x-0 translate-y-0",
};

export function ScrollReveal({
  children,
  className,
  direction = "up",
  delayMs = 0,
  threshold = 0.2,
  style,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -12% 0px",
        threshold,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={elementRef}
      className={cn(
        "transform-gpu transition-all duration-700 ease-out will-change-transform motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
        isVisible
          ? "translate-x-0 translate-y-0 rotate-0 scale-100 opacity-100"
          : cn("opacity-0", hiddenDirectionClass[direction]),
        className,
      )}
      style={{
        ...style,
        transitionDelay: isVisible && delayMs > 0 ? `${delayMs}ms` : undefined,
      }}
    >
      {children}
    </div>
  );
}
