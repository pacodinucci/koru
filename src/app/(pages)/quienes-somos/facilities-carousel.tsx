"use client";

import Image from "next/image";
import { useRef } from "react";

type FacilityImage = {
  src: string;
  alt: string;
  caption: string;
  objectPosition?: string;
};

type FacilitiesCarouselProps = {
  images: FacilityImage[];
};

export function FacilitiesCarousel({ images }: FacilitiesCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "previous" | "next") => {
    const scroller = scrollerRef.current;

    if (!scroller) return;

    scroller.scrollBy({
      left: direction === "next" ? scroller.clientWidth * 0.82 : scroller.clientWidth * -0.82,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-[7vw] pb-5 md:gap-7 md:px-[10vw] [&::-webkit-scrollbar]:hidden"
        aria-label="Carrusel de instalaciones"
      >
        {images.map((image) => (
          <figure
            key={image.src}
            className="min-w-[84vw] snap-center md:min-w-[70vw] lg:min-w-[66vw]"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 66vw, (min-width: 768px) 70vw, 84vw"
                className="object-cover"
                style={{ objectPosition: image.objectPosition }}
              />
            </div>
            <figcaption className="mt-4 text-xs font-semibold text-black/55 md:text-sm">
              {image.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-7xl justify-center gap-5 px-6 md:justify-end md:px-10 lg:px-14">
        <button
          type="button"
          onClick={() => scroll("previous")}
          className="text-3xl font-bold leading-none text-black transition hover:text-[#caa27d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          aria-label="Ver instalación anterior"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => scroll("next")}
          className="text-3xl font-bold leading-none text-black transition hover:text-[#caa27d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          aria-label="Ver siguiente instalación"
        >
          →
        </button>
      </div>
    </div>
  );
}
