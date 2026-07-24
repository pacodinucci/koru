"use client";

import { useEffect } from "react";

type SnapScrollHandoffProps = {
  containerId: string;
};

export function SnapScrollHandoff({ containerId }: SnapScrollHandoffProps) {
  useEffect(() => {
    const container = document.getElementById(containerId);

    if (!container) {
      return;
    }

    function handleWheel(event: WheelEvent) {
      if (!container) {
        return;
      }

      const maxScrollTop = container.scrollHeight - container.clientHeight;
      const atTop = container.scrollTop <= 1;
      const atBottom = container.scrollTop >= maxScrollTop - 1;

      if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        event.preventDefault();
        window.scrollBy({ top: event.deltaY, behavior: "auto" });
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [containerId]);

  return null;
}
