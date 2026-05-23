"use client";

import { cloudinaryImageUrl } from "@/lib/cloudinary";

type NonCmsEditorialSectionProps = {
  bannerTitle?: string;
  bannerClassName?: string;
  imageSrc?: string;
  imageFrameWidth?: string;
  imageFrameHeight?: string;
  imageScale?: number;
};

export function NonCmsEditorialSection({
  bannerTitle,
  bannerClassName = "bg-[var(--brand-900)]",
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
    <section className="mt-16 bg-white">
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
          <h2 className="space-y-1 text-4xl leading-[0.9] tracking-tight text-black md:text-6xl">
            <span
              className="block font-light uppercase"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              Adventure as
            </span>
            <span
              className="block italic"
              style={{ fontFamily: "var(--font-indie-flower)" }}
            >
              Agency
            </span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-black/85 md:text-xl">
            Texto descriptivo principal para contar la idea de la sección. Texto
            descriptivo principal para contar la idea de la sección.
          </p>

          <p className="mt-6 max-w-3xl text-2xl leading-tight text-black/90 md:text-4xl">
            Texto destacado en negrita para reforzar el mensaje central.
          </p>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-black/85 md:text-xl">
            Párrafo complementario con detalles y cierre del bloque de contenido.
            Párrafo complementario con detalles y cierre del bloque de contenido.
          </p>
        </div>

        <div className="relative mx-auto overflow-hidden" style={frameStyle}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Niñas y niños en actividad comunitaria"
              className="h-full w-full object-contain"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
