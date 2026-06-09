"use client";

import Image from "next/image";
import { cloudinaryImageUrl } from "@/lib/cloudinary";
import { ScrollReveal } from "@/modules/landing/views/components/scroll-reveal";

type NonCmsEditorialSectionProps = {
  bannerTitle?: string;
  bannerClassName?: string;
  bodyText?: string;
  highlightText?: string;
  closingText?: string;
  imageSrc?: string;
  imageFrameWidth?: string;
  imageFrameHeight?: string;
  imageScale?: number;
};

export function NonCmsEditorialSection({
  bannerTitle,
  bannerClassName = "bg-[var(--brand-900)]",
  bodyText = "Creemos que la educación es un proceso compartido. Niñas, niños, familias y colaboradores formamos un mismo organismo, donde cada parte influye en el desarrollo individual y colectivo.",
  highlightText = "Por eso, el acompañamiento no ocurre sólo dentro del espacio educativo, sino también en casa y en la relación cotidiana.",
  closingText = "Ser parte de esta comunidad implica una participación activa y comprometida. Ser parte de este espacio implica formar parte de una comunidad que aprende, se cuestiona y evoluciona.",
  imageSrc = cloudinaryImageUrl(
    "koru/landing/DSC01342",
    "/assets/images/DSC01342.png",
  ),
  imageFrameWidth = "320px",
  imageFrameHeight,
  imageScale = 1,
}: NonCmsEditorialSectionProps) {
  const frameStyle = {
    width: `calc(${imageFrameWidth} * ${imageScale})`,
    height: imageFrameHeight
      ? `calc(${imageFrameHeight} * ${imageScale})`
      : undefined,
  } as const;

  return (
    <section className="bg-white">
      <ScrollReveal direction="up">
        {bannerTitle ? (
          <div className={`${bannerClassName} py-6`}>
            <div className="mx-auto w-full max-w-7xl px-6 md:px-10 lg:px-14">
              <h2
                className="text-4xl leading-tight italic text-white md:text-6xl"
                style={{ fontFamily: "var(--font-roboto-condensed)" }}
              >
                {bannerTitle}
              </h2>
            </div>
          </div>
        ) : null}
        <div
          className="mx-auto grid w-full max-w-7xl items-start gap-10 px-6 py-20 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          <div>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-black/85 md:text-xl">
              {bodyText}
            </p>

            <p className="mt-6 max-w-3xl text-2xl leading-tight text-black/90 md:text-4xl">
              {highlightText}
            </p>

            <p className="mt-6 max-w-3xl text-base leading-relaxed text-black/85 md:text-xl">
              {closingText}
            </p>
          </div>

          <div className="relative mx-auto overflow-hidden" style={frameStyle}>
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt="Niñas y niños en actividad comunitaria"
                width={1200}
                height={1200}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="h-auto w-full object-contain"
                unoptimized={imageSrc.startsWith("http")}
              />
            ) : null}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
