"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { KoruShape1 } from "@/components/koru-shape-1";
import { CmsPageEditableImage } from "@/modules/cms/components/cms-page-editable-image";
import type { CmsImageMap } from "@/modules/cms/server/cms-image.repository";
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
import {
  getLandingContentSlotValue,
  hardcodedLandingContentSlots,
  landingContentSlotIds,
} from "@/modules/landing/content-slots";
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
  imageMap?: CmsImageMap;
} & LandingPreviewBindings;

type SectionRendererProps = {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
  imageMap?: CmsImageMap;
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
  imageMap?: CmsImageMap;
  previewMode?: boolean;
  selectedContentSlotId?: string | null;
  onSelectContentSlot?: (slotId: string) => void;
  responsiveMode?: LandingResponsiveMode;
};

function LandingVisionBridgeSection({
  textMap,
  imageMap,
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
      <KoruShape1
        x="-44px"
        y="70px"
        size={240}
        color="var(--complement-800)"
        opacity={0.16}
        rotate={-8}
      />
      <KoruShape1
        size={260}
        color="var(--brand-600)"
        opacity={0.12}
        rotate={178}
        flipX
        style={{ right: "-48px", top: "120px", left: "auto" }}
      />
      <KoruShape1
        size={280}
        color="var(--orange-600)"
        opacity={0.12}
        rotate={158}
        flipX
        style={{ right: "-54px", bottom: "10px", left: "auto", top: "auto" }}
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
              <CmsPageEditableImage
                slotId="landing.image.welcome"
                defaultSrc={imageUrl}
                alt="Comunidad educativa compartiendo actividades"
                imageMap={imageMap}
                previewMode={previewMode}
                selectedContentSlotId={selectedContentSlotId}
                onSelectContentSlot={onSelectContentSlot}
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
      </ScrollReveal>
    </section>
  );
}

const testimonialCards = [
  {
    textSlotId: landingContentSlotIds.testimonialOneText,
    nameSlotId: landingContentSlotIds.testimonialOneName,
  },
  {
    textSlotId: landingContentSlotIds.testimonialTwoText,
    nameSlotId: landingContentSlotIds.testimonialTwoName,
  },
  {
    textSlotId: landingContentSlotIds.testimonialThreeText,
    nameSlotId: landingContentSlotIds.testimonialThreeName,
  },
  {
    textSlotId: landingContentSlotIds.testimonialFourText,
    nameSlotId: landingContentSlotIds.testimonialFourName,
  },
  {
    textSlotId: landingContentSlotIds.testimonialFiveText,
    nameSlotId: landingContentSlotIds.testimonialFiveName,
  },
] as const;

const marqueeTestimonialCards = [
  ...testimonialCards,
  ...testimonialCards,
] as const;

function LandingTestimonialsSection({
  textMap,
  previewMode,
  selectedContentSlotId,
  onSelectContentSlot,
  responsiveMode,
}: HardcodedContentBindings) {
  return (
    <section className="overflow-hidden bg-white px-6 pt-16 pb-32 md:px-10 md:pb-40 lg:px-14 lg:pt-20 lg:pb-52">
      <ScrollReveal
        direction="up"
        className="mx-[calc(50%-50vw)] overflow-hidden"
      >
        <style>{`
          @keyframes koru-testimonials-marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }

          .koru-testimonials-marquee {
            animation: koru-testimonials-marquee 46s linear infinite;
          }

          .koru-testimonials-marquee:hover {
            animation-play-state: paused;
          }

          @media (prefers-reduced-motion: reduce) {
            .koru-testimonials-marquee {
              animation: none;
              transform: none;
            }
          }
        `}</style>
        <div className="overflow-hidden px-[max(1.5rem,calc((100vw-80rem)/2))] pb-4">
          <div className="koru-testimonials-marquee flex w-max items-center gap-8">
            {marqueeTestimonialCards.map((card, index) => {
              const textSlot = getHardcodedSlot(card.textSlotId);

              return (
                <div
                  key={`${card.textSlotId}-${index}`}
                  className="flex shrink-0 items-center gap-8"
                >
                  {index > 0 ? (
                    <Image
                      src="/assets/quote-divider-vertical.svg"
                      alt=""
                      width={10}
                      height={180}
                      aria-hidden="true"
                      className="h-36 w-2 shrink-0 opacity-90"
                    />
                  ) : null}
                  <article className="flex min-h-[12rem] w-[min(82vw,28rem)] shrink-0 flex-col justify-between bg-white p-7 text-left md:w-[30rem] lg:w-[31rem]">
                    <EditableContentSlot
                      as="blockquote"
                      slot={textSlot}
                      textMap={textMap}
                      previewMode={previewMode}
                      selected={selectedContentSlotId === card.textSlotId}
                      onSelect={onSelectContentSlot}
                      responsiveMode={responsiveMode}
                      className="text-[var(--complement-800)]"
                      style={{ fontFamily: "var(--font-indie-flower)" }}
                    >
                      &quot;{getLandingContentSlotValue(textMap, textSlot)}&quot;
                    </EditableContentSlot>
                    <div className="mt-8 pt-4">
                      <EditableContentSlot
                        as="p"
                        slot={getHardcodedSlot(card.nameSlotId)}
                        textMap={textMap}
                        previewMode={previewMode}
                        selected={selectedContentSlotId === card.nameSlotId}
                        onSelect={onSelectContentSlot}
                        responsiveMode={responsiveMode}
                        className="font-semibold text-black"
                        style={{ fontFamily: "var(--font-montserrat)" }}
                      />
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
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
  imageMap,
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
          imageCaptionTextSlotId={
            section.id.includes("-copy")
              ? landingContentSlotIds.editorialTwoImageCaption
              : landingContentSlotIds.editorialOneImageCaption
          }
          textMap={textMap}
          previewMode={previewMode}
          selectedContentSlotId={selectedContentSlotId}
          onSelectContentSlot={onSelectContentSlot}
          responsiveMode={responsiveMode}
          imageSlotId={
            section.id.includes("-copy")
              ? "landing.image.editorial.1"
              : "landing.image.editorial.0"
          }
          imageMap={imageMap}
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
          imageMap={imageMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          responsiveMode={responsiveMode}
          onMoveSectionExtraPosition={onMoveSectionExtraPosition}
          selectedContentSlotId={selectedContentSlotId}
          onSelectContentSlot={onSelectContentSlot}
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
  imageMap,
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
                              imageMap={imageMap}
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
                          imageMap={imageMap}
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
                        imageMap={imageMap}
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
      <LandingTestimonialsSection
        textMap={responsiveMap}
        previewMode={previewMode}
        selectedContentSlotId={selectedContentSlotId}
        onSelectContentSlot={onSelectContentSlot}
        responsiveMode={effectiveResponsiveMode}
      />
    </div>
  );
}
