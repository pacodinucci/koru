import { useEffect, useState } from "react";

export function useGallerySlides(
  galleryVariant: string,
  autoplaySeconds: number,
  slideCount: number,
) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    if (galleryVariant !== "carousel" && galleryVariant !== "stacked") {
      return;
    }
    if (autoplaySeconds <= 0 || slideCount <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveSlideIndex((previous) => (previous + 1) % slideCount);
    }, autoplaySeconds * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [autoplaySeconds, galleryVariant, slideCount]);

  const normalizedSlideIndex =
    slideCount > 0
      ? ((activeSlideIndex % slideCount) + slideCount) % slideCount
      : 0;

  function goToSlide(nextIndex: number) {
    if (slideCount === 0) {
      return;
    }
    const normalized = (nextIndex + slideCount) % slideCount;
    setActiveSlideIndex(normalized);
  }

  function getRelativeSlideOffset(index: number) {
    if (slideCount <= 1) {
      return 0;
    }
    const total = slideCount;
    const rawDelta = index - normalizedSlideIndex;
    const normalizedDelta = ((rawDelta % total) + total) % total;
    return normalizedDelta > total / 2
      ? normalizedDelta - total
      : normalizedDelta;
  }

  return {
    normalizedSlideIndex,
    goToSlide,
    getRelativeSlideOffset,
  };
}

