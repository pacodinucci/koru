"use client";

import { useState, type CSSProperties, type ElementType } from "react";

import { CmsPageEditableImage } from "@/modules/cms/components/cms-page-editable-image";
import type { CmsImageMap } from "@/modules/cms/server/cms-image.repository";
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
  {
    name: "Nuevo integrante",
    role: "Rol por definir",
  },
  {
    name: "Nuevo integrante",
    role: "Rol por definir",
  },
  {
    name: "Nuevo integrante",
    role: "Rol por definir",
  },
  {
    name: "Nuevo integrante",
    role: "Rol por definir",
  },
];

const facilityImages = [
  {
    src: "/assets/images/insta1.png",
    alt: "Instalaciones de Koru preparadas para actividades de aprendizaje",
  },
  {
    src: "/assets/images/insta2.png",
    alt: "Espacio interior de Koru para explorar y convivir",
  },
  {
    src: "/assets/images/insta3.png",
    alt: "Ambiente de aprendizaje dentro de las instalaciones de Koru",
    objectPosition: "center bottom",
  },
  {
    src: "/assets/images/insta4.png",
    alt: "?rea de Koru preparada para experiencias educativas",
  },
  {
    src: "/assets/images/insta5.png",
    alt: "Instalaci?n de Koru con materiales y espacios de trabajo",
  },
  {
    src: "/assets/images/insta6.png",
    alt: "Vista de una instalaci?n de Koru",
  },
  {
    src: "/assets/images/insta7.png",
    alt: "Espacio de convivencia en las instalaciones de Koru",
  },
  {
    src: "/assets/images/insta8.png",
    alt: "Instalaciones de Koru integradas al d?a a d?a de la comunidad",
  },
  {
    src: "",
    alt: "Instalaciones de Koru · Imagen 9",
  },
  {
    src: "",
    alt: "Instalaciones de Koru · Imagen 10",
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
  imageMap?: CmsImageMap;
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
  imageSlotId: string;
  reverse?: boolean;
} & QuienesSomosViewProps;

function MissionVisionSection({
  titleSlotId,
  bodySlotId,
  imageSrc,
  imageAlt,
  imageSlotId,
  reverse = false,
  textMap,
  imageMap,
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
            <CmsPageEditableImage
              slotId={imageSlotId}
              defaultSrc={imageSrc}
              alt={imageAlt}
              imageMap={imageMap}
              previewMode={previewMode}
              selectedContentSlotId={selectedContentSlotId}
              onSelectContentSlot={onSelectContentSlot}
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
  imageMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
}: QuienesSomosViewProps) {
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);
  return (
    <section
      id="equipo"
      className="relative bg-[#caa27d] px-6 py-16 md:px-10 lg:px-14 lg:py-24"
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
          {teamMembers.map((member, index) => {
            const isSelected = selectedMemberIndex === index;
            const hasSelectedMember = selectedMemberIndex !== null;
            return (
            <article
              key={`${member.name}-${member.role}-${index}`}
              tabIndex={previewMode ? -1 : 0}
              role={previewMode ? undefined : "button"}
              aria-expanded={isSelected}
              onClickCapture={(event) => {
                if (!previewMode) return;
                const target = event.target as HTMLElement;
                if (target.closest('[data-content-slot-id^="content.quienes-somos.team.member."]')) return;
                event.preventDefault();
                event.stopPropagation();
                setSelectedMemberIndex(isSelected ? null : index);
              }}
              onClick={() => { if (!previewMode) setSelectedMemberIndex(isSelected ? null : index); }}
              onKeyDown={(event) => { if (!previewMode && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelectedMemberIndex(isSelected ? null : index); } }}
              className={["group relative aspect-[4/5] overflow-hidden bg-black outline-none transition-[transform,opacity,filter] duration-500 ease-out motion-reduce:transition-none", isSelected ? "z-20 scale-[1.08] shadow-2xl" : hasSelectedMember ? "z-0 scale-[0.96] opacity-45 saturate-50" : "z-0 hover:z-10 hover:scale-110 focus-visible:z-10 focus-visible:scale-110", previewMode ? "cursor-default" : "cursor-pointer"].join(" ")}
            >
              {member.imageSrc || imageMap?.[`about.image.team.${index}`] ? (
                <CmsPageEditableImage
                  slotId={`about.image.team.${index}`}
                  defaultSrc={member.imageSrc ?? ""}
                  alt={`${member.name}, ${member.role}`}
                  imageMap={imageMap}
                  previewMode={previewMode}
                  selectedContentSlotId={selectedContentSlotId}
                  onSelectContentSlot={onSelectContentSlot}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover opacity-65 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0"
                  lockFrame
                />
              ) : (
                <button
                  type="button"
                  data-content-slot-id={`about.image.team.${index}`}
                  onClick={(event) => {
                    if (!previewMode) return;
                    event.preventDefault();
                    event.stopPropagation();
                    onSelectContentSlot?.(`about.image.team.${index}`);
                  }}
                  className="flex h-full w-full items-center justify-center bg-[#f3d889] text-6xl font-semibold text-slate-950/80 transition duration-300 group-hover:text-slate-950 group-focus-visible:text-slate-950"
                  aria-label={`Cargar imagen de ${member.name}`}
                >
                  {getInitials(member.name)}
                </button>
              )}
<div className={`pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/15 to-transparent transition-opacity duration-300 ${previewMode ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`} />
              <div className={`absolute inset-x-0 bottom-0 z-30 p-5 text-white transition-all duration-300 ${previewMode ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"}`}>
                <EditableCopy
                  as="h3"
                  slotId={`content.quienes-somos.team.member.${index}.name`}
                  textMap={textMap}
                  previewMode={previewMode}
                  selectedContentSlotId={selectedContentSlotId}
                  onSelectContentSlot={onSelectContentSlot}
                  className="text-3xl leading-none"
                  style={{ fontFamily: "var(--font-roboto-condensed)" }}
                />
                <EditableCopy
                  as="p"
                  slotId={`content.quienes-somos.team.member.${index}.role`}
                  textMap={textMap}
                  previewMode={previewMode}
                  selectedContentSlotId={selectedContentSlotId}
                  onSelectContentSlot={onSelectContentSlot}
                  className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-white/80"
                />
                {isSelected ? (
                  <p className="mt-4 border-t border-white/30 pt-4 text-sm leading-relaxed text-white/90">
                    Conocé más sobre su recorrido y su forma de acompañar en Koru.
                  </p>
                ) : null}
              </div>
            </article>
          );
          })}
        </div>
        {selectedMemberIndex !== null ? (
          <div className={previewMode ? "absolute inset-0 z-50 flex items-center justify-center p-6 md:p-10" : "fixed inset-0 z-50 flex items-center justify-center p-6 md:p-10"} role="dialog" aria-modal="true">
            <button type="button" className={previewMode ? "absolute inset-0 bg-black/60" : "absolute inset-0 bg-black/70 backdrop-blur-sm"} aria-label="Cerrar perfil" onClick={() => setSelectedMemberIndex(null)} />
            <article className="relative z-10 aspect-[4/5] w-full max-w-md overflow-hidden bg-black shadow-2xl animate-in fade-in zoom-in-75 duration-500">
              {teamMembers[selectedMemberIndex].imageSrc || imageMap?.["about.image.team." + selectedMemberIndex] ? (
                <CmsPageEditableImage slotId={"about.image.team." + selectedMemberIndex} defaultSrc={teamMembers[selectedMemberIndex].imageSrc ?? ""} alt={teamMembers[selectedMemberIndex].name + ", " + teamMembers[selectedMemberIndex].role} imageMap={imageMap} previewMode={false} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} fill sizes="(min-width: 768px) 90vw, 448px" className="object-cover" lockFrame />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#f3d889] text-8xl font-semibold text-slate-950/80">{getInitials(teamMembers[selectedMemberIndex].name)}</div>
              )}
              <button type="button" onClick={() => setSelectedMemberIndex(null)} className="absolute top-5 z-20 flex h-10 w-10 items-center justify-center text-3xl leading-none text-white transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" style={{ right: "1.25rem", left: "auto" }} aria-label="Cerrar perfil">×</button>
              <div className="absolute inset-x-0 bottom-0 z-10 p-7 text-white" style={{ background: "linear-gradient(to top, rgba(0, 0, 0, 0.96) 0%, rgba(0, 0, 0, 0.82) 48%, rgba(0, 0, 0, 0) 100%)" }}>
                <EditableCopy as="h3" slotId={"content.quienes-somos.team.member." + selectedMemberIndex + ".name"} textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} className="text-5xl leading-none" style={{ fontFamily: "var(--font-roboto-condensed)" }} />
                <EditableCopy as="p" slotId={"content.quienes-somos.team.member." + selectedMemberIndex + ".role"} textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} className="mt-3 text-sm font-medium uppercase tracking-[0.14em] text-white/80" />
                <EditableCopy as="p" slotId={"content.quienes-somos.team.member." + selectedMemberIndex + ".detail"} textMap={textMap} previewMode={previewMode} selectedContentSlotId={selectedContentSlotId} onSelectContentSlot={onSelectContentSlot} className="mt-5 border-t border-white/30 pt-5 text-base leading-relaxed text-white/90" />
              </div>
            </article>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FacilitiesSection({
  textMap,
  imageMap,
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

      <FacilitiesCarousel
        images={facilityImages}
        textMap={textMap}
        imageMap={imageMap}
        previewMode={previewMode}
        selectedContentSlotId={selectedContentSlotId}
        onSelectContentSlot={onSelectContentSlot}
      />
    </section>
  );
}

export function QuienesSomosView({
  textMap,
  imageMap,
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
            <CmsPageEditableImage
              slotId="about.image.hero"
              defaultSrc="/assets/images/DSC01400.png"
              alt="Niñas y niños compartiendo una actividad en comunidad"
              imageMap={imageMap}
              previewMode={previewMode}
              selectedContentSlotId={selectedContentSlotId}
              onSelectContentSlot={onSelectContentSlot}
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
        imageAlt="Niñas y niños aprendiendo juntos en la naturaleza"
        imageSlotId="about.image.mission"
        imageMap={imageMap}
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
        imageSlotId="about.image.vision"
        imageMap={imageMap}
        reverse
        textMap={textMap}
        previewMode={previewMode}
        selectedContentSlotId={selectedContentSlotId}
        onSelectContentSlot={onSelectContentSlot}
      />

      <TeamSection
        textMap={textMap}
        imageMap={imageMap}
        previewMode={previewMode}
        selectedContentSlotId={selectedContentSlotId}
        onSelectContentSlot={onSelectContentSlot}
      />
      <FacilitiesSection
        textMap={textMap}
        imageMap={imageMap}
        previewMode={previewMode}
        selectedContentSlotId={selectedContentSlotId}
        onSelectContentSlot={onSelectContentSlot}
      />
    </main>
  );
}
