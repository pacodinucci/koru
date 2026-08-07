import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SmoothHashScroll } from "./smooth-hash-scroll";
import { accompanimentGroups } from "@/modules/como-acompanamos/content-slots";

type GroupPageProps = {
  params: Promise<{
    grupo: string;
  }>;
};

function groupSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateStaticParams() {
  return accompanimentGroups.map((group) => ({
    grupo: groupSlug(group.title),
  }));
}

export async function generateMetadata({ params }: GroupPageProps) {
  const { grupo } = await params;
  const group = accompanimentGroups.find(
    (item) => groupSlug(item.title) === grupo,
  );

  if (!group) {
    return {};
  }

  return {
    title: `${group.title} | Koru`,
    description: `${group.title}, ${group.ageRange}. Acompañamiento pedagógico en Koru.`,
  };
}

function DetailSection({
  eyebrow,
  children,
  id,
}: {
  eyebrow: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-36 bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-10 md:py-20 lg:px-14">
        <p className="mb-7 max-w-5xl text-sm font-semibold uppercase tracking-[0.28em] text-[#6d7e96]">
          {eyebrow}
        </p>
        <div className="max-w-5xl space-y-5 text-2xl leading-relaxed text-black/90 md:text-[1.7rem] md:leading-[1.55]">
          {children}
        </div>
      </div>
    </section>
  );
}

export default async function GrupoAcompanamientoPage({
  params,
}: GroupPageProps) {
  const { grupo } = await params;
  const group = accompanimentGroups.find(
    (item) => groupSlug(item.title) === grupo,
  );

  if (!group) {
    notFound();
  }

  return (
    <main
      className="bg-[#f7f6f1]"
      style={{ fontFamily: "var(--font-montserrat)" }}
    >
      <SmoothHashScroll />
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:px-14 lg:py-20">
        <div className="space-y-7">
          <Link
            href="/como-acompanamos#grupos-de-acompanamiento"
            className="inline-flex text-sm font-semibold uppercase tracking-[0.18em] text-[var(--complement-800)] transition hover:text-[var(--complement-900)]"
          >
            {"Grupos de acompañamiento"}
          </Link>
          <header className="space-y-3">
            <h1
              className="text-[clamp(3rem,9vw,6rem)] leading-[0.9] tracking-tight text-black"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              {group.title}
            </h1>
            <p
              className="text-[clamp(1.8rem,5vw,2.6rem)] leading-none text-black/75"
              style={{ fontFamily: "var(--font-indie-flower)" }}
            >
              {group.ageRange}
            </p>
          </header>
          <div className="space-y-4 text-lg leading-relaxed text-black/80 md:text-xl">
            {group.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="relative mx-auto aspect-[4/5] w-full max-w-[24rem] overflow-hidden rounded-[44%_56%_47%_53%/53%_45%_55%_47%]">
          <Image
            src={group.imageSrc}
            alt={group.imageAlt}
            fill
            className="object-cover"
            priority
          />
        </div>
      </section>

      {"experienceCards" in group && group.experienceCards ? (
        <section className="bg-white">
          <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-10 md:py-20 lg:px-14">
            <div className="mx-auto max-w-5xl pb-[45vh]">
              {group.experienceCards.map((card, index) => (
                <article
                  key={card.title}
                  className="sticky top-48 mb-[35vh] grid min-h-[34rem] overflow-hidden rounded-[2rem] border border-black/10 bg-[#f7f6f1] shadow-[0_22px_70px_rgba(0,0,0,0.16)] md:grid-cols-2 lg:min-h-[38rem]"
                  style={{ zIndex: index + 1 }}
                >
                  <div className="flex flex-col justify-center p-7 md:p-10 lg:p-12">
                    <h2
                      className="mb-5 text-4xl leading-none text-black md:text-5xl"
                      style={{ fontFamily: "var(--font-roboto-condensed)" }}
                    >
                      {card.title}
                    </h2>
                    <p className="text-lg leading-relaxed text-black/80 md:text-xl">
                      {card.description}
                    </p>
                  </div>
                  <div className="relative min-h-[18rem] md:min-h-full">
                    <Image
                      src={card.imageSrc}
                      alt={card.imageAlt}
                      fill
                      className="object-cover"
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {group.closing ? (
        <section className="bg-[#f3f2ef]">
          <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-10 lg:px-14 lg:py-20">
            <p
              className="mx-auto max-w-5xl text-center text-3xl leading-[1.25] text-black md:text-4xl"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              {group.closing}
            </p>
          </div>
        </section>
      ) : null}

      {group.bullets ? (
        <DetailSection eyebrow="En este grupo acompañamos">
          <ul className="space-y-4 pl-6">
            {group.bullets.map((item) => (
              <li
                key={item}
                className="list-disc marker:text-[var(--complement-800)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {!("hideRhythmSection" in group && group.hideRhythmSection) ? (
        <DetailSection id="ritmo-y-experiencias" eyebrow="Ritmo y experiencias">
          {group.rhythmIntro ? <p>{group.rhythmIntro}</p> : null}
          {group.rhythmBullets ? (
            <ul className="space-y-4 pl-6">
              {group.rhythmBullets.map((item) => (
                <li
                  key={item}
                  className="list-disc marker:text-[var(--complement-800)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              Cada propuesta se adapta al momento evolutivo del grupo,
              integrando aprendizaje, vínculo, naturaleza y comunidad.
            </p>
          )}
        </DetailSection>
      ) : null}
    </main>
  );
}
