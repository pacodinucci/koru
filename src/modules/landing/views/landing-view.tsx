"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { LandingNav } from "@/modules/landing/components/landing-nav";
import {
  ensureLandingDefaults,
  getSectionFieldKey,
  parseLandingStructure,
  type LandingSectionInstance,
} from "@/modules/landing/config/landing-sections";
import {
  getLandingFieldFontSize,
  type LandingPreviewBindings,
  type LandingTextMap,
} from "@/modules/landing/types/landing-text";

type LandingViewProps = {
  textMap: LandingTextMap;
} & LandingPreviewBindings;

function selectableClass(active: boolean, previewMode?: boolean) {
  return cn(
    previewMode && "cursor-pointer rounded-sm transition",
    active && "ring-2 ring-primary/50",
  );
}

function textKey(sectionId: string, fieldKey: string) {
  return getSectionFieldKey(sectionId, fieldKey);
}

function renderField(
  section: LandingSectionInstance,
  fieldKey: string,
  fallback: string,
  fallbackSize: number,
  textMap: LandingTextMap,
) {
  const key = textKey(section.id, fieldKey);
  return {
    key,
    value: textMap[key] ?? fallback,
    fontSize: getLandingFieldFontSize(textMap, key, fallbackSize),
  };
}

function HeroSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  const kicker = renderField(section, "kicker", "BIENVENID@S A KORU OSA", 12, textMap);
  const title = renderField(
    section,
    "title",
    "En Koru, entendemos la educacion como un organismo vivo.",
    56,
    textMap,
  );
  const body = renderField(
    section,
    "body",
    "Nuestro cuerpo escolar no es un molde rigido, sino una forma cambiante.",
    20,
    textMap,
  );
  const cta = renderField(section, "cta", "Make a donation", 14, textMap);

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden border-b border-black/10 bg-[#f4efe5]">
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#d5e8d4]/60 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-[#c8d8f0]/70 blur-3xl" />
      <div className="relative mx-auto grid w-full max-w-[92rem] gap-8 px-5 py-20 md:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-12">
        <div>
          <p
            className={selectableClass(selectedFieldId === kicker.key, previewMode)}
            onClick={() => onSelectField?.(kicker.key)}
            style={{ fontSize: `${kicker.fontSize}px` }}
          >
            {kicker.value}
          </p>
          <h1
            className={cn(
              "mt-4 max-w-3xl leading-tight font-semibold tracking-tight text-black",
              selectableClass(selectedFieldId === title.key, previewMode),
            )}
            onClick={() => onSelectField?.(title.key)}
            style={{ fontSize: `${title.fontSize}px` }}
          >
            {title.value}
          </h1>
          <p
            className={cn(
              "mt-6 max-w-2xl leading-7 text-black/70",
              selectableClass(selectedFieldId === body.key, previewMode),
            )}
            onClick={() => onSelectField?.(body.key)}
            style={{ fontSize: `${body.fontSize}px` }}
          >
            {body.value}
          </p>
          <a
            href="#tour"
            onClick={(event) => {
              if (previewMode) {
                event.preventDefault();
                onSelectField?.(cta.key);
              }
            }}
            className="mt-8 inline-flex h-11 items-center rounded-full bg-black px-6 font-medium text-white transition hover:opacity-85"
          >
            <span
              className={selectableClass(selectedFieldId === cta.key, previewMode)}
              style={{ fontSize: `${cta.fontSize}px` }}
            >
              {cta.value}
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

function CardsSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  const kicker = renderField(section, "kicker", "NUESTRA MIRADA", 12, textMap);
  const title = renderField(section, "title", "Pedagogias alternativas", 40, textMap);
  const body = renderField(section, "body", "Comunidad y transformacion.", 18, textMap);
  const cards = [1, 2, 3].map((index) => ({
    title: renderField(section, `card${index}_title`, `Card ${index}`, 30, textMap),
    body: renderField(section, `card${index}_body`, "Descripcion", 18, textMap),
  }));

  return (
    <section className="flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-[92rem] px-5 py-20 md:px-8 lg:px-12">
        <p
          className={cn(
            "text-black/55",
            selectableClass(selectedFieldId === kicker.key, previewMode),
          )}
          onClick={() => onSelectField?.(kicker.key)}
          style={{ fontSize: `${kicker.fontSize}px` }}
        >
          {kicker.value}
        </p>
        <h2
          className={cn(
            "mt-3 max-w-4xl leading-tight font-semibold tracking-tight",
            selectableClass(selectedFieldId === title.key, previewMode),
          )}
          onClick={() => onSelectField?.(title.key)}
          style={{ fontSize: `${title.fontSize}px` }}
        >
          {title.value}
        </h2>
        <p
          className={cn(
            "mt-4 max-w-3xl leading-7 text-black/75",
            selectableClass(selectedFieldId === body.key, previewMode),
          )}
          onClick={() => onSelectField?.(body.key)}
          style={{ fontSize: `${body.fontSize}px` }}
        >
          {body.value}
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cards.map((card, index) => (
            <article key={index} className="rounded-3xl border border-black/10 bg-white p-6">
              <h3
                className={cn(
                  "font-semibold tracking-tight",
                  selectableClass(selectedFieldId === card.title.key, previewMode),
                )}
                onClick={() => onSelectField?.(card.title.key)}
                style={{ fontSize: `${card.title.fontSize}px` }}
              >
                {card.title.value}
              </h3>
              <p
                className={cn(
                  "mt-3 leading-7 text-black/75",
                  selectableClass(selectedFieldId === card.body.key, previewMode),
                )}
                onClick={() => onSelectField?.(card.body.key)}
                style={{ fontSize: `${card.body.fontSize}px` }}
              >
                {card.body.value}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StorySection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  const title = renderField(section, "title", "Una practica educativa", 40, textMap);
  const body = renderField(section, "body", "Descripcion", 18, textMap);
  const quote = renderField(section, "quote", "Koru es abrazo, tribu y transformacion.", 26, textMap);

  return (
    <section className="flex min-h-screen items-center border-y border-black/10 bg-[#ece9df]">
      <div className="mx-auto w-full max-w-[92rem] px-5 py-20 md:px-8 lg:px-12">
        <h2
          className={cn(
            "max-w-4xl leading-tight font-semibold tracking-tight",
            selectableClass(selectedFieldId === title.key, previewMode),
          )}
          onClick={() => onSelectField?.(title.key)}
          style={{ fontSize: `${title.fontSize}px` }}
        >
          {title.value}
        </h2>
        <p
          className={cn(
            "mt-5 max-w-3xl leading-7 text-black/75",
            selectableClass(selectedFieldId === body.key, previewMode),
          )}
          onClick={() => onSelectField?.(body.key)}
          style={{ fontSize: `${body.fontSize}px` }}
        >
          {body.value}
        </p>
        <p
          className={cn(
            "mt-8 font-medium text-black/85",
            selectableClass(selectedFieldId === quote.key, previewMode),
          )}
          onClick={() => onSelectField?.(quote.key)}
          style={{ fontSize: `${quote.fontSize}px` }}
        >
          {quote.value}
        </p>
      </div>
    </section>
  );
}

function GallerySection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  const title = renderField(section, "title", "Galeria de experiencias", 40, textMap);
  const body = renderField(section, "body", "Momentos de aprendizaje", 18, textMap);
  const items = [1, 2, 3, 4].map((index) =>
    renderField(section, `item${index}`, `Item ${index}`, 18, textMap),
  );

  return (
    <section className="flex min-h-screen items-center">
      <div className="mx-auto w-full max-w-[92rem] px-5 py-20 md:px-8 lg:px-12">
        <h2
          className={cn(
            "leading-tight font-semibold tracking-tight",
            selectableClass(selectedFieldId === title.key, previewMode),
          )}
          onClick={() => onSelectField?.(title.key)}
          style={{ fontSize: `${title.fontSize}px` }}
        >
          {title.value}
        </h2>
        <p
          className={cn(
            "mt-4 text-black/75",
            selectableClass(selectedFieldId === body.key, previewMode),
          )}
          onClick={() => onSelectField?.(body.key)}
          style={{ fontSize: `${body.fontSize}px` }}
        >
          {body.value}
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <article
              key={index}
              className="flex h-52 items-end rounded-3xl border border-black/10 bg-gradient-to-br from-[#d9e8d4] via-[#f4efe5] to-[#d8cfb6] p-5"
            >
              <p
                className={cn(
                  "font-medium text-black/90",
                  selectableClass(selectedFieldId === item.key, previewMode),
                )}
                onClick={() => onSelectField?.(item.key)}
                style={{ fontSize: `${item.fontSize}px` }}
              >
                {item.value}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  const title = renderField(section, "title", "Conoce nuestra propuesta", 40, textMap);
  const body = renderField(section, "body", "Una mirada breve", 18, textMap);
  const url = renderField(section, "url", "https://www.youtube.com/embed/dQw4w9WgXcQ", 14, textMap);

  return (
    <section className="flex min-h-screen items-center border-y border-black/10 bg-[#f8f7f2]">
      <div className="mx-auto grid w-full max-w-[92rem] gap-8 px-5 py-20 md:px-8 lg:grid-cols-[1fr_1fr] lg:px-12">
        <div>
          <h2
            className={cn(
              "leading-tight font-semibold tracking-tight",
              selectableClass(selectedFieldId === title.key, previewMode),
            )}
            onClick={() => onSelectField?.(title.key)}
            style={{ fontSize: `${title.fontSize}px` }}
          >
            {title.value}
          </h2>
          <p
            className={cn(
              "mt-4 text-black/75",
              selectableClass(selectedFieldId === body.key, previewMode),
            )}
            onClick={() => onSelectField?.(body.key)}
            style={{ fontSize: `${body.fontSize}px` }}
          >
            {body.value}
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-black">
          <iframe
            src={url.value}
            title="Koru video"
            className="h-[320px] w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <p
            className={cn(
              "px-4 py-3 text-white/65",
              selectableClass(selectedFieldId === url.key, previewMode),
            )}
            onClick={() => onSelectField?.(url.key)}
            style={{ fontSize: `${url.fontSize}px` }}
          >
            {url.value}
          </p>
        </div>
      </div>
    </section>
  );
}

function FooterSection({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  const brand = renderField(section, "brand", "Koru", 38, textMap);
  const campus = renderField(section, "campus", "Campus Koru", 38, textMap);
  const mail = renderField(section, "mail", "hola@koru.academy", 24, textMap);
  const legal = renderField(
    section,
    "legal",
    "(c) 2026 Koru - Organismo Social de Aprendizaje",
    20,
    textMap,
  );

  return (
    <footer className="border-t border-[#d8d3a8] bg-[#d8cfb6]">
      <div className="grid w-full gap-10 px-3 py-14 md:grid-cols-2 md:px-5 lg:grid-cols-4 lg:gap-8 lg:px-7">
        <section>
          <h3
            className={selectableClass(selectedFieldId === brand.key, previewMode)}
            onClick={() => onSelectField?.(brand.key)}
            style={{ fontSize: `${brand.fontSize}px` }}
          >
            {brand.value}
          </h3>
        </section>

        <section>
          <h4
            className={selectableClass(selectedFieldId === campus.key, previewMode)}
            onClick={() => onSelectField?.(campus.key)}
            style={{ fontSize: `${campus.fontSize}px` }}
          >
            {campus.value}
          </h4>
        </section>

        <section>
          <p
            className={selectableClass(selectedFieldId === mail.key, previewMode)}
            onClick={() => onSelectField?.(mail.key)}
            style={{ fontSize: `${mail.fontSize}px` }}
          >
            {mail.value}
          </p>
          <p
            className={cn("mt-6", selectableClass(selectedFieldId === legal.key, previewMode))}
            onClick={() => onSelectField?.(legal.key)}
            style={{ fontSize: `${legal.fontSize}px` }}
          >
            {legal.value}
          </p>
        </section>

        <section className="text-right text-black/60">
          <Link href="#">Instagram</Link>
        </section>
      </div>
    </footer>
  );
}

function SectionRenderer({
  section,
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings) {
  switch (section.type) {
    case "hero":
      return (
        <HeroSection
          section={section}
          textMap={textMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
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
}: LandingViewProps) {
  const completeMap = ensureLandingDefaults(textMap);
  const structure = parseLandingStructure(completeMap);

  return (
    <div className="min-h-screen bg-[#f4efe5] text-black">
      <LandingNav />
      {structure.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          textMap={completeMap}
          previewMode={previewMode}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
        />
      ))}
    </div>
  );
}
