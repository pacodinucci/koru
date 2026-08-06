"use client";

import { useEffect } from "react";

export function SmoothHashScroll() {
  useEffect(() => {
    if (!window.location.hash) return;

    const target = document.querySelector(window.location.hash);
    if (!target) return;

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return null;
}
