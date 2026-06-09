"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { FernShape } from "@/components/fern-shape";
import { SporeShape } from "@/components/spore-shape";
import { isCodeFirstLandingMode } from "@/modules/landing/config/landing-mode";
import {
  defaultLandingBackgroundSpores,
  ensureLandingDefaults,
  parseLandingBackgroundScopes,
  parseLandingStructure,
  type LandingBackgroundScope,
  type LandingSectionInstance,
} from "@/modules/landing/config/landing-sections";
import type {
  LandingPreviewBindings,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";
import {
  createResponsiveScopedTextMap,
  getResponsiveModeFromWidth,
  type LandingResponsiveMode,
} from "@/modules/landing/types/landing-text";
import { cloudinaryImageUrl } from "@/lib/cloudinary";
import { ScrollReveal } from "@/modules/landing/views/components/scroll-reveal";
import { CardsSection } from "@/modules/landing/views/sections/cards-section";
import { FooterSection } from "@/modules/landing/views/sections/footer-section";
import { GallerySection } from "@/modules/landing/views/sections/gallery-section";
import { HeroSection } from "@/modules/landing/views/sections/hero-section";
import { ImageGridSection } from "@/modules/landing/views/sections/image-grid-section";
import { NonCmsEditorialSection } from "@/modules/landing/views/sections/non-cms-editorial-section";
import { SporeFeatureStackSection } from "@/modules/landing/views/sections/spore-feature-stack-section";
import { StorySection } from "@/modules/landing/views/sections/story-section";
import { VideoSection } from "@/modules/landing/views/sections/video-section";

type LandingViewProps = {
  textMap: LandingTextMap;
} & LandingPreviewBindings;

type SectionRendererProps = {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings;

type ScopedSectionGroup = {
  scopeId: string;
  sections: LandingSectionInstance[];
};

function LandingVisionBridgeSection() {
  const imageUrl = cloudinaryImageUrl(
    "koru/landing/DSC01443",
    "/assets/images/DSC01443.png",
  );

  return (
    <section className="relative overflow-hidden bg-white">
      <FernShape x="-56px" y="40px" size={220} color="#4d7b53" opacity={0.25} />
      <FernShape
        size={280}
        color="#4d7b53"
        opacity={0.2}
        rotate={180}
        style={{ right: "-64px", bottom: "32px", left: "auto", top: "auto" }}
      />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-16 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-14 lg:py-24">
        <ScrollReveal direction="right" className="lg:order-2">
          <h2
            className="mb-8 text-5xl leading-[0.95] tracking-tight text-black md:text-6xl"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            Bienvenidos a Koru
          </h2>
          <div className="max-w-3xl space-y-6 text-xl leading-relaxed text-black/85">
            <p>
              Co-creamos una cultura viva donde niñas, niños, familias y
              acompañantes asumen un rol activo y corresponsable en los
              procesos de aprendizaje y desarrollo.
            </p>
            <p>
              Queremos una comunidad donde cada persona fortalezca su brújula
              interna, despliegue sus dones y participe conscientemente en la
              regeneración social y ecológica.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal
          direction="left"
          className="relative mx-auto w-full max-w-[28rem] lg:order-1"
        >
          <div className="relative aspect-square overflow-hidden rounded-full">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Comunidad educativa compartiendo actividades"
                fill
                className="object-cover rotate-90"
              />
            ) : null}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function LandingQuoteSection() {
  return (
    <section className="bg-white">
      <ScrollReveal
        direction="up"
        className="mx-auto w-full max-w-6xl px-6 py-16 text-center md:px-10 lg:px-14 lg:py-20"
      >
        <blockquote
          className="mx-auto max-w-5xl text-[clamp(1.5rem,3.4vw,2.9rem)] leading-[1.16] text-[var(--complement-800)]"
          style={{ fontFamily: "var(--font-indie-flower)" }}
        >
          “Koru ha sido mágico para nuestra hija. Su creatividad, su bondad y
          su curiosidad por el mundo florecen cada día. La vemos crecer en su
          mejor versión.”
        </blockquote>
        <div className="mt-7 flex justify-center">
          <Image
            src="/assets/quote-underline.svg"
            alt=""
            aria-hidden="true"
            width={180}
            height={10}
            className="h-[10px] w-[180px]"
          />
        </div>
        <p className="mt-5 text-center text-xl text-black">Tutor de Koru</p>
      </ScrollReveal>
    </section>
  );
}

function groupSectionsByScope(
  sections: LandingSectionInstance[],
  scopeIdsInOrder: string[],
): ScopedSectionGroup[] {
  const groups = scopeIdsInOrder.map((scopeId) => ({
    scopeId,
    sections: [] as LandingSectionInstance[],
  }));
  const groupMap = new Map(groups.map((group) => [group.scopeId, group]));
  const fallbackScopeId = scopeIdsInOrder[0] ?? "scope-default";

  for (const section of sections) {
    const resolvedScopeId =
      section.scopeId && groupMap.has(section.scopeId)
        ? section.scopeId
        : fallbackScopeId;
    groupMap.get(resolvedScopeId)?.sections.push(section);
  }

  return groups;
}

function ScopeBackground({
  scope,
  disableScopeMinHeight = false,
  children,
}: {
  scope: LandingBackgroundScope;
  disableScopeMinHeight?: boolean;
  children: React.ReactNode;
}) {
  const scopeHeight = `calc(var(--landing-vh, 100dvh) * ${scope.heightVh} / 100)`;
  const backgroundStyle: CSSProperties =
    scope.visualMode === "gradient"
      ? {
          backgroundImage: scope.gradient,
          minHeight: disableScopeMinHeight ? undefined : scopeHeight,
        }
      : {
          backgroundColor: scope.color,
          minHeight: disableScopeMinHeight ? undefined : scopeHeight,
        };

  if (scope.type !== "spore") {
    return (
      <div
        className="relative isolate overflow-visible"
        style={backgroundStyle}
      >
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div className="relative isolate overflow-visible" style={backgroundStyle}>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {(scope.spores ?? defaultLandingBackgroundSpores).map(
          (spore, index) => (
            <SporeShape
              key={`scope-spore-${scope.id}-${index}`}
              className="absolute mix-blend-multiply"
              style={{ left: `${spore.x}%`, top: `${spore.y}%` }}
              size={spore.size}
              color={spore.color}
              opacity={spore.opacity}
              rotate={spore.rotate}
              flipX={spore.flipX}
              flipY={spore.flipY}
            />
          ),
        )}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function SectionRenderer({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
  responsiveMode,
  onMoveSectionExtraPosition,
}: SectionRendererProps) {
  switch (section.type) {
    case "hero":
      return (
        <HeroSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          responsiveMode={responsiveMode}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "cards":
      return (
        <CardsSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          responsiveMode={responsiveMode}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "story":
      return (
        <StorySection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          responsiveMode={responsiveMode}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "gallery":
      return (
        <GallerySection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          responsiveMode={responsiveMode}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "editorial-feature":
      return (
        <NonCmsEditorialSection
          bannerTitle={
            section.id.includes("-copy")
              ? "Breve explicación del enfoque"
              : "Qué nos hace diferentes"
          }
          bannerClassName={
            section.id.includes("-copy")
              ? "bg-[var(--complement-900)]"
              : "bg-[var(--complement-900)]"
          }
          bodyText={
            section.id.includes("-copy")
              ? "Koru propone un enfoque pedagógico integral que combina mirada antroposófica, inteligencia socioemocional, aprendizaje transdisciplinario por proyectos y habilidades del siglo XXI."
              : undefined
          }
          highlightText={
            section.id.includes("-copy")
              ? "Las niñas y los niños aprenden a partir de experiencias significativas conectadas con sus intereses."
              : undefined
          }
          closingText={
            section.id.includes("-copy")
              ? "Acompañamos cada proceso de forma personalizada, cultivando capacidades cognitivas, emocionales, sociales y prácticas en comunidad y en vínculo con la naturaleza."
              : undefined
          }
          imageSrc={
            section.id.includes("-copy")
              ? cloudinaryImageUrl(
                  "koru/landing/DSC01273",
                  "/assets/images/DSC01273.png",
                )
              : cloudinaryImageUrl(
                  "koru/landing/DSC01344",
                  "/assets/images/DSC01344.png",
                )
          }
          imageScale={1}
        />
      );
    case "spore-stack":
      return (
        <SporeFeatureStackSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          responsiveMode={responsiveMode}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "image-grid":
      return (
        <ImageGridSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          responsiveMode={responsiveMode}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "video":
      return (
        <VideoSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          responsiveMode={responsiveMode}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    case "footer":
      return (
        <FooterSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          responsiveMode={responsiveMode}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
        />
      );
    default:
      return null;
  }
}

export function LandingView({
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
  responsiveMode,
  onMoveSectionExtraPosition,
}: LandingViewProps) {
  const isCodeFirst = isCodeFirstLandingMode();
  const completeMap = ensureLandingDefaults(textMap);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [measuredMode, setMeasuredMode] =
    useState<LandingResponsiveMode>("large");

  useEffect(() => {
    if (responsiveMode) {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const updateMode = () => {
      const nextWidth = root.clientWidth;
      if (nextWidth > 0) {
        setMeasuredMode(getResponsiveModeFromWidth(nextWidth));
      }
    };

    updateMode();
    const observer = new ResizeObserver(updateMode);
    observer.observe(root);
    window.addEventListener("resize", updateMode);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMode);
    };
  }, [responsiveMode]);

  const effectiveResponsiveMode = responsiveMode ?? measuredMode;
  const responsiveMap = createResponsiveScopedTextMap(
    completeMap,
    effectiveResponsiveMode,
  );
  const scopes = isCodeFirst
    ? [
        {
          id: "scope-default",
          name: "Fondo base",
          type: "none" as const,
          visualMode: "color" as const,
          color: "#ffffff",
          gradient: "linear-gradient(180deg,#ffffff 0%,#f8f8f8 100%)",
          heightVh: 100,
        },
      ]
    : parseLandingBackgroundScopes(completeMap);
  const scopeMap = new Map(scopes.map((scope) => [scope.id, scope]));
  const structure = parseLandingStructure(completeMap).filter(
    (section) => section.type !== "footer",
  );
  const videoSectionId =
    structure.find((section) => section.type === "video")?.id ?? null;
  const groupedSections = useMemo(
    () =>
      groupSectionsByScope(
        structure,
        scopes.map((scope) => scope.id),
      ),
    [structure, scopes],
  );

  return (
    <div ref={rootRef} className="font-fira">
      {groupedSections.map((group, groupIndex) => {
        const scope =
          scopeMap.get(group.scopeId) ??
          ({
            id: group.scopeId,
            name: "Fondo base",
            type: "none",
            visualMode: "color",
            color: "#ffffff",
            gradient: "linear-gradient(180deg,#ffffff 0%,#f8f8f8 100%)",
            heightVh: 1000,
          } as const);

        return (
          <ScopeBackground
            key={`${group.scopeId}-${groupIndex}`}
            scope={scope}
            disableScopeMinHeight={isCodeFirst}
          >
            {group.sections.map((section) => {
              return (
                <div key={section.id}>
                  {section.id === videoSectionId ? (
                    <div>
                      <div data-preview-section-id={section.id}>
                        <div className="landing-video-pin">
                          <div className="landing-video-static">
                            <SectionRenderer
                              section={section}
                              textMap={responsiveMap}
                              previewMode={previewMode}
                              selectedFieldId={selectedFieldId}
                              onSelectField={onSelectField}
                              responsiveMode={effectiveResponsiveMode}
                              onMoveSectionExtraPosition={
                                onMoveSectionExtraPosition
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="landing-overlap-content">
                        <LandingVisionBridgeSection />
                        <LandingQuoteSection />
                      </div>
                    </div>
                  ) : (
                    <div
                      data-preview-section-id={section.id}
                      className={
                        !previewMode ? "landing-overlap-content" : undefined
                      }
                    >
                      <SectionRenderer
                        section={section}
                        textMap={responsiveMap}
                        previewMode={previewMode}
                        selectedFieldId={selectedFieldId}
                        onSelectField={onSelectField}
                        responsiveMode={effectiveResponsiveMode}
                        onMoveSectionExtraPosition={onMoveSectionExtraPosition}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </ScopeBackground>
        );
      })}
    </div>
  );
}

