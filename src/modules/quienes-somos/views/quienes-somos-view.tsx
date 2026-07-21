"use client";

import Image from "next/image";
import type { CSSProperties, ElementType } from "react";

import { EditableContentSlot } from "@/modules/landing/views/components/editable-content-slot";
import type {
  LandingPreviewBindings,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";
import {
  getQuienesSomosContentSlots,
  quienesSomosContentSlotIds,
} from "@/modules/quienes-somos/content-slots";

import { FacilitiesCarousel } from "@/app/(pages)/quienes-somos/facilities-carousel";

const contentSlotMap = new Map(
  getQuienesSomosContentSlots().map((slot) => [slot.id, slot]),
);

function getContentSlot(slotId: string) {
  const slot = contentSlotMap.get(slotId);

  if (!slot) {
    throw new Error(`Unknown Quienes Somos content slot: ${slotId}`);
  }

  return slot;
}

const teamMembers = [
  {
    name: "Karla Novelo",
    role: "Fundadora y Directora General",
    imageSrc: "/assets/images/equipo11.png",
  },
  {
    name: "Florencia Bennetts",
    role: "Directora de la Cultura",
    imageSrc: "/assets/images/equipo10.png",
  },
  {
    name: "Samantha",
    role: "Coordinadora Acad?mica",
    imageSrc: "/assets/images/equipo7.png",
  },
  {
    name: "Daniel",
    role: "Coordinador Psicopedag?gico",
    imageSrc: "/assets/images/equipo14.png",
  },
  {
    name: "Radha",
    role: "Tutora Grupo Esporas",
    imageSrc: "/assets/images/equipo3.png",
  },
  {
    name: "N?lida",
    role: "Tutora Grupo Esporas",
  },
  {
    name: "Isaac",
    role: "Tutor Grupo Koru",
  },
  {
    name: "Indra",
    role: "Asistente Grupo Koru",
    imageSrc: "/assets/images/equipo15.png",
  },
  {
    name: "Beatriz",
    role: "Tutora de Helechos 1",
    imageSrc: "/assets/images/equipo1.png",
  },
  {
    name: "Jari",
    role: "Asistente Helechos 1",
    imageSrc: "/assets/images/equipo16.png",
  },
  {
    name: "Diego",
    role: "Co-tutor Helechos 2",
    imageSrc: "/assets/images/equipo17.png",
  },
  {
    name: "Vamsi",
    role: "Co-tutora Helechos 2",
  },
  {
    name: "Violeta",
    role: "Maestra de Lectura y Matem?ticas",
    imageSrc: "/assets/images/equipo9.png",
  },
  {
    name: "Francisco",
    role: "Circo",
    imageSrc: "/assets/images/equipo12.png",
  },
  {
    name: "Carlos",
    role: "Ingl?s",
  },
  {
    name: "???",
    role: "Ecolog?a",
  },
];

const facilityImages = [
  {
    src: "/assets/images/insta1.png",
    alt: "Instalaciones de Koru preparadas para actividades de aprendizaje",
    caption: "Instalaciones Koru.",
  },
  {
    src: "/assets/images/insta2.png",
    alt: "Espacio interior de Koru para explorar y convivir",
    caption: "Espacios para explorar, crear y convivir.",
  },
  {
    src: "/assets/images/insta3.png",
    alt: "Ambiente de aprendizaje dentro de las instalaciones de Koru",
    caption: "Ambientes pensados para aprender en comunidad.",
    objectPosition: "center bottom",
  },
  {
    src: "/assets/images/insta4.png",
    alt: "?rea de Koru preparada para experiencias educativas",
    caption: "Rincones vivos para el aprendizaje cotidiano.",
  },
  {
    src: "/assets/images/insta5.png",
    alt: "Instalaci?n de Koru con materiales y espacios de trabajo",
    caption: "Espacios que acompa?an distintas formas de aprender.",
  },
  {
    src: "/assets/images/insta6.png",
    alt: "Vista de una instalaci?n de Koru",
    caption: "Entornos c?lidos para compartir y descubrir.",
  },
  {
    src: "/assets/images/insta7.png",
    alt: "Espacio de convivencia en las instalaciones de Koru",
    caption: "Lugares para el encuentro y la colaboraci?n.",
  },
  {
    src: "/assets/images/insta8.png",
    alt: "Instalaciones de Koru integradas al d?a a d?a de la comunidad",
    caption: "Instalaciones integradas a la vida de la comunidad.",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type QuienesSomosViewProps = {
  textMap: LandingTextMap;
} & Pick<
  LandingPreviewBindings,
  "previewMode" | "selectedContentSlotId" | "onSelectContentSlot"
>;

type EditableCopyProps = {
  slotId: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  stylePriority?: "base" | "override";
  textMap: LandingTextMap;
} & Pick<
  LandingPreviewBindings,
  "previewMode" | "selectedContentSlotId" | "onSelectContentSlot"
>;

function EditableCopy({
  slotId,
  as,
  className,
  style,
  stylePriority,
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: EditableCopyProps) {
  return (
    <EditableContentSlot
      as={as}
      slot={getContentSlot(slotId)}
      textMap={textMap}
      previewMode={previewMode}
      selected={selectedContentSlotId === slotId}
      onSelect={onSelectContentSlot}
      className={className}
      style={style}
      stylePriority={stylePriority}
    />
  );
}

type MissionVisionSectionProps = {
  titleSlotId: string;
  bodySlotId: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
} & QuienesSomosViewProps;

function MissionVisionSection({
  titleSlotId,
  bodySlotId,
  imageSrc,
  imageAlt,
  reverse = false,
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: MissionVisionSectionProps) {
  return (
    <section className="bg-white">
      <div
        className={`mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-16 md:px-10 lg:gap-16 lg:px-14 lg:py-24 ${
          reverse
            ? "lg:grid-cols-[0.95fr_1.05fr]"
            : "lg:grid-cols-[1.05fr_0.95fr]"
        }`}
      >
        <div className={reverse ? "lg:order-2" : ""}>
          <EditableCopy
            as="h2"
            slotId={titleSlotId}
            textMap={textMap}
            previewMode={previewMode}
            selectedContentSlotId={selectedContentSlotId}
            onSelectContentSlot={onSelectContentSlot}
            className="mb-8 text-5xl leading-[0.95] tracking-tight text-black md:text-6xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          />

          <div className="max-w-3xl space-y-6 text-xl leading-relaxed text-black/85">
            <EditableCopy
              as="p"
              slotId={bodySlotId}
              textMap={textMap}
              previewMode={previewMode}
              selectedContentSlotId={selectedContentSlotId}
              onSelectContentSlot={onSelectContentSlot}
            />
          </div>
        </div>

        <div
          className={`relative mx-auto w-full max-w-[28rem] ${reverse ? "lg:order-1" : ""}`}
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamSection({
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: QuienesSomosViewProps) {
  return (
    <section
      id="equipo"
      className="bg-[#caa27d] px-6 py-16 md:px-10 lg:px-14 lg:py-24"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <EditableCopy
            as="p"
            slotId={quienesSomosContentSlotIds.teamEyebrow}
            textMap={textMap}
            previewMode={previewMode}
            selectedContentSlotId={selectedContentSlotId}
            onSelectContentSlot={onSelectContentSlot}
            className="mb-4 text-sm font-medium tracking-[0.18em] text-white/75"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4">
          {teamMembers.map((member, index) => (
            <article
              key={`${member.name}-${member.role}-${index}`}
              tabIndex={0}
              className="group relative aspect-[4/5] overflow-hidden bg-black outline-none transition-transform duration-300 ease-out hover:z-10 hover:scale-110 focus-visible:z-10 focus-visible:scale-110"
            >
              {member.imageSrc ? (
                <Image
                  src={member.imageSrc}
                  alt={`${member.name}, ${member.role}`}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover opacity-65 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#f3d889] text-6xl font-semibold text-slate-950/80 transition duration-300 group-hover:text-slate-950 group-focus-visible:text-slate-950">
                  {getInitials(member.name)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-4 p-5 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                <h3
                  className="text-3xl leading-none"
                  style={{ fontFamily: "var(--font-roboto-condensed)" }}
                >
                  {member.name}
                </h3>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-white/80">
                  {member.role}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FacilitiesSection({
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: QuienesSomosViewProps) {
  return (
    <section
      id="instalaciones"
      className="overflow-hidden bg-white py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto mb-10 w-full max-w-7xl px-6 md:px-10 lg:px-14">
        <EditableCopy
          as="p"
          slotId={quienesSomosContentSlotIds.facilitiesEyebrow}
          textMap={textMap}
          previewMode={previewMode}
          selectedContentSlotId={selectedContentSlotId}
          onSelectContentSlot={onSelectContentSlot}
          className="mb-4 text-sm font-medium tracking-[0.18em] text-[#6d7e96]"
        />

        <EditableCopy
          as="p"
          slotId={quienesSomosContentSlotIds.facilitiesBody}
          textMap={textMap}
          previewMode={previewMode}
          selectedContentSlotId={selectedContentSlotId}
          onSelectContentSlot={onSelectContentSlot}
          className="max-w-3xl text-xl leading-relaxed text-black/80"
        />
      </div>

      <FacilitiesCarousel images={facilityImages} />
    </section>
  );
}

export function QuienesSomosView({
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: QuienesSomosViewProps) {
  return (
    <main className="bg-white" style={{ fontFamily: "var(--font-montserrat)" }}>
      <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-16 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-14 lg:py-24">
        <div className="space-y-8">
          <EditableCopy
            as="p"
            slotId={quienesSomosContentSlotIds.heroEyebrow}
            textMap={textMap}
            previewMode={previewMode}
            selectedContentSlotId={selectedContentSlotId}
            onSelectContentSlot={onSelectContentSlot}
            className="text-sm font-medium tracking-[0.18em] text-[#6d7e96]"
          />

          <h1 className="space-y-1 text-5xl leading-[0.95] tracking-tight text-black md:text-6xl lg:text-7xl">
            <EditableCopy
              as="span"
              slotId={quienesSomosContentSlotIds.heroTitleLine1}
              textMap={textMap}
              previewMode={previewMode}
              selectedContentSlotId={selectedContentSlotId}
              onSelectContentSlot={onSelectContentSlot}
              className="block font-light"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            />
            <EditableCopy
              as="span"
              slotId={quienesSomosContentSlotIds.heroTitleLine2}
              textMap={textMap}
              previewMode={previewMode}
              selectedContentSlotId={selectedContentSlotId}
              onSelectContentSlot={onSelectContentSlot}
              className="block italic"
              style={{ fontFamily: "var(--font-indie-flower)" }}
            />
          </h1>

          <div className="max-w-3xl space-y-6 text-xl leading-relaxed text-black/85">
            {[
              quienesSomosContentSlotIds.heroParagraphOne,
              quienesSomosContentSlotIds.heroParagraphTwo,
              quienesSomosContentSlotIds.heroParagraphThree,
              quienesSomosContentSlotIds.heroParagraphFour,
            ].map((slotId) => (
              <EditableCopy
                key={slotId}
                as="p"
                slotId={slotId}
                textMap={textMap}
                previewMode={previewMode}
                selectedContentSlotId={selectedContentSlotId}
                onSelectContentSlot={onSelectContentSlot}
              />
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[28rem]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
            <Image
              src="/assets/images/DSC01400.png"
              alt="Ni?as y ni?os compartiendo una actividad en comunidad"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f3f2ef]">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-10 lg:px-14 lg:py-20">
          <EditableCopy
            as="p"
            slotId={quienesSomosContentSlotIds.featured}
            textMap={textMap}
            previewMode={previewMode}
            selectedContentSlotId={selectedContentSlotId}
            onSelectContentSlot={onSelectContentSlot}
            className="mx-auto max-w-5xl text-center text-3xl leading-[1.25] text-black md:text-4xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          />
        </div>
      </section>

      <MissionVisionSection
        titleSlotId={quienesSomosContentSlotIds.missionTitle}
        bodySlotId={quienesSomosContentSlotIds.missionBody}
        imageSrc="/assets/images/image2.png"
        imageAlt="Ni?as y ni?os aprendiendo juntos en la naturaleza"
        textMap={textMap}
        previewMode={previewMode}
        selectedContentSlotId={selectedContentSlotId}
        onSelectContentSlot={onSelectContentSlot}
      />

      <MissionVisionSection
        titleSlotId={quienesSomosContentSlotIds.visionTitle}
        bodySlotId={quienesSomosContentSlotIds.visionBody}
        imageSrc="/assets/images/image1.png"
        imageAlt="Comunidad educativa compartiendo actividades"
        reverse
        textMap={textMap}
        previewMode={previewMode}
        selectedContentSlotId={selectedContentSlotId}
        onSelectContentSlot={onSelectContentSlot}
      />

      <TeamSection
        textMap={textMap}
        previewMode={previewMode}
        selectedContentSlotId={selectedContentSlotId}
        onSelectContentSlot={onSelectContentSlot}
      />
      <FacilitiesSection
        textMap={textMap}
        previewMode={previewMode}
        selectedContentSlotId={selectedContentSlotId}
        onSelectContentSlot={onSelectContentSlot}
      />
    </main>
  );
}
