"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
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
import { EditableContentSlot } from "@/modules/landing/views/components/editable-content-slot";
import { hardcodedLandingContentSlots, landingContentSlotIds } from "@/modules/landing/content-slots";
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

const hardcodedSlotMap = new Map(
  hardcodedLandingContentSlots.map((slot) => [slot.id, slot]),
);

function getHardcodedSlot(slotId: string) {
  const slot = hardcodedSlotMap.get(slotId);
  if (!slot) {
    throw new Error(`Missing landing content slot: ${slotId}`);
  }
  return slot;
}

type HardcodedContentBindings = {
  textMap: LandingTextMap;
  previewMode?: boolean;
  selectedContentSlotId?: string | null;
  onSelectContentSlot?: (slotId: string) => void;
  responsiveMode?: LandingResponsiveMode;
};

function LandingVisionBridgeSection({
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
  responsiveMode,
}: HardcodedContentBindings) {
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
          <EditableContentSlot
            as="h2"
            slot={getHardcodedSlot(landingContentSlotIds.visionTitle)}
            textMap={textMap}
            previewMode={previewMode}
            selected={selectedContentSlotId === landingContentSlotIds.visionTitle}
            onSelect={onSelectContentSlot}
            responsiveMode={responsiveMode}
            className="mb-8 text-5xl leading-[0.95] tracking-tight text-black md:text-6xl"
          />
          <div className="max-w-3xl space-y-6 text-xl leading-relaxed text-black/85">
            <EditableContentSlot
              as="p"
              slot={getHardcodedSlot(landingContentSlotIds.visionBodyOne)}
              textMap={textMap}
              previewMode={previewMode}
              selected={
                selectedContentSlotId === landingContentSlotIds.visionBodyOne
              }
              onSelect={onSelectContentSlot}
              responsiveMode={responsiveMode}
            />
            <EditableContentSlot
              as="p"
              slot={getHardcodedSlot(landingContentSlotIds.visionBodyTwo)}
              textMap={textMap}
              previewMode={previewMode}
              selected={
                selectedContentSlotId === landingContentSlotIds.visionBodyTwo
              }
              onSelect={onSelectContentSlot}
              responsiveMode={responsiveMode}
            />
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

function LandingQuoteSection({
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
  responsiveMode,
}: HardcodedContentBindings) {
  return (
    <section className="bg-white">
      <ScrollReveal
        direction="up"
        className="mx-auto w-full max-w-6xl px-6 py-16 text-center md:px-10 lg:px-14 lg:py-20"
      >
        <EditableContentSlot
          as="blockquote"
          slot={getHardcodedSlot(landingContentSlotIds.quoteText)}
          textMap={textMap}
          previewMode={previewMode}
          selected={selectedContentSlotId === landingContentSlotIds.quoteText}
          onSelect={onSelectContentSlot}
          responsiveMode={responsiveMode}
          className="mx-auto max-w-5xl leading-[1.16] text-[var(--complement-800)]"
          style={{ fontFamily: "var(--font-indie-flower)" }}
        />
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
        <EditableContentSlot
          as="p"
          slot={getHardcodedSlot(landingContentSlotIds.quoteAuthor)}
          textMap={textMap}
          previewMode={previewMode}
          selected={selectedContentSlotId === landingContentSlotIds.quoteAuthor}
          onSelect={onSelectContentSlot}
          responsiveMode={responsiveMode}
          className="mt-5 text-center text-xl text-black"
        />
      </ScrollReveal>
    </section>
  );
}

function LandingAdmissionsCtaSection({
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
  responsiveMode,
}: HardcodedContentBindings) {
  return (
    <section className="bg-white px-6 pt-16 pb-32 md:px-10 md:pb-40 lg:px-14 lg:pt-20 lg:pb-52">
      <ScrollReveal
        direction="up"
        className="relative mx-auto flex min-h-[24rem] max-w-6xl flex-col items-center justify-center overflow-hidden rounded-none px-6 py-20 text-center shadow-sm shadow-[var(--brand-900)]/10 md:min-h-[28rem] md:px-10 lg:py-24"
        style={{
          background:
            "radial-gradient(circle at 18% 18%, var(--orange-300) 0%, transparent 28%), radial-gradient(circle at 82% 24%, var(--brand-500) 0%, transparent 30%), linear-gradient(135deg, var(--brand-800) 0%, var(--brand-600) 42%, var(--complement-700) 100%)",
        }}
      >
        <FernShape
          x="-42px"
          y="28px"
          size={190}
          color="var(--complement-800)"
          opacity={0.22}
          rotate={-8}
        />
        <FernShape
          size={230}
          color="var(--brand-800)"
          opacity={0.16}
          rotate={178}
          flipX
          style={{ right: "-54px", bottom: "24px", left: "auto", top: "auto" }}
        />
        <div className="absolute inset-0 bg-white/35" aria-hidden="true" />
        <EditableContentSlot
          as="h2"
          slot={getHardcodedSlot(landingContentSlotIds.admissionsTitle)}
          textMap={textMap}
          previewMode={previewMode}
          selected={selectedContentSlotId === landingContentSlotIds.admissionsTitle}
          onSelect={onSelectContentSlot}
          responsiveMode={responsiveMode}
          className="relative z-10 leading-[0.95] tracking-tight text-white"
          style={{ fontFamily: "var(--font-roboto-condensed)" }}
        />
        <Link
          href="/admisiones"
          className="relative z-10 mt-8 inline-flex rounded-md bg-white px-8 py-4 text-base font-semibold uppercase tracking-[0.18em] text-[var(--brand-800)] hover:bg-[var(--complement-500)]"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          <EditableContentSlot
            slot={getHardcodedSlot(landingContentSlotIds.admissionsButton)}
            textMap={textMap}
            previewMode={previewMode}
            selected={
              selectedContentSlotId === landingContentSlotIds.admissionsButton
            }
            onSelect={onSelectContentSlot}
            responsiveMode={responsiveMode}
          />
        </Link>
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
  selectedContentSlotId,
  onSelectContentSlot,
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
              ? textMap[landingContentSlotIds.editorialTwoTitle] ??
                getHardcodedSlot(landingContentSlotIds.editorialTwoTitle)
                  .defaultValue
              : textMap[landingContentSlotIds.editorialOneTitle] ??
                getHardcodedSlot(landingContentSlotIds.editorialOneTitle)
                  .defaultValue
          }
          bannerTitleSlotId={
            section.id.includes("-copy")
              ? landingContentSlotIds.editorialTwoTitle
              : landingContentSlotIds.editorialOneTitle
          }
          bannerClassName={
            section.id.includes("-copy")
              ? "bg-[var(--complement-900)]"
              : "bg-[var(--complement-900)]"
          }
          bodyText={
            section.id.includes("-copy")
              ? textMap[landingContentSlotIds.editorialTwoBody] ??
                getHardcodedSlot(landingContentSlotIds.editorialTwoBody)
                  .defaultValue
              : textMap[landingContentSlotIds.editorialOneBody] ??
                getHardcodedSlot(landingContentSlotIds.editorialOneBody)
                  .defaultValue
          }
          bodyTextSlotId={
            section.id.includes("-copy")
              ? landingContentSlotIds.editorialTwoBody
              : landingContentSlotIds.editorialOneBody
          }
          highlightText={
            section.id.includes("-copy")
              ? textMap[landingContentSlotIds.editorialTwoHighlight] ??
                getHardcodedSlot(landingContentSlotIds.editorialTwoHighlight)
                  .defaultValue
              : textMap[landingContentSlotIds.editorialOneHighlight] ??
                getHardcodedSlot(landingContentSlotIds.editorialOneHighlight)
                  .defaultValue
          }
          highlightTextSlotId={
            section.id.includes("-copy")
              ? landingContentSlotIds.editorialTwoHighlight
              : landingContentSlotIds.editorialOneHighlight
          }
          closingText={
            section.id.includes("-copy")
              ? textMap[landingContentSlotIds.editorialTwoClosing] ??
                getHardcodedSlot(landingContentSlotIds.editorialTwoClosing)
                  .defaultValue
              : textMap[landingContentSlotIds.editorialOneClosing] ??
                getHardcodedSlot(landingContentSlotIds.editorialOneClosing)
                  .defaultValue
          }
          closingTextSlotId={
            section.id.includes("-copy")
              ? landingContentSlotIds.editorialTwoClosing
              : landingContentSlotIds.editorialOneClosing
          }
          textMap={textMap}
          previewMode={previewMode}
          selectedContentSlotId={selectedContentSlotId}
          onSelectContentSlot={onSelectContentSlot}
          responsiveMode={responsiveMode}
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
          selectedContentSlotId={selectedContentSlotId}
          onSelectContentSlot={onSelectContentSlot}
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
  selectedContentSlotId,
  onSelectContentSlot,
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
                          <div
                            className={`landing-video-static ${
                              previewMode ? "landing-video-static--interactive" : ""
                            }`}
                          >
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
                              selectedContentSlotId={selectedContentSlotId}
                              onSelectContentSlot={onSelectContentSlot}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="landing-overlap-content">
                        <LandingVisionBridgeSection
                          textMap={responsiveMap}
                          previewMode={previewMode}
                          selectedContentSlotId={selectedContentSlotId}
                          onSelectContentSlot={onSelectContentSlot}
                          responsiveMode={effectiveResponsiveMode}
                        />
                        <LandingQuoteSection
                          textMap={responsiveMap}
                          previewMode={previewMode}
                          selectedContentSlotId={selectedContentSlotId}
                          onSelectContentSlot={onSelectContentSlot}
                          responsiveMode={effectiveResponsiveMode}
                        />
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
                        selectedContentSlotId={selectedContentSlotId}
                        onSelectContentSlot={onSelectContentSlot}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </ScopeBackground>
        );
      })}
      <LandingAdmissionsCtaSection
        textMap={responsiveMap}
        previewMode={previewMode}
        selectedContentSlotId={selectedContentSlotId}
        onSelectContentSlot={onSelectContentSlot}
        responsiveMode={effectiveResponsiveMode}
      />
    </div>
  );
}
