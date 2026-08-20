import Link from "next/link";
import { notFound } from "next/navigation";

import { methodologies } from "@/modules/como-acompanamos/content-slots";

type MethodologyPageProps = {
  params: Promise<{
    metodologia: string;
  }>;
};

export function generateStaticParams() {
  return methodologies.map((methodology) => ({
    metodologia: methodology.slug,
  }));
}

export async function generateMetadata({ params }: MethodologyPageProps) {
  const { metodologia } = await params;
  const methodology = methodologies.find(
    (item) => item.slug === metodologia,
  );

  if (!methodology) {
    return {};
  }

  return {
    title: `${methodology.title} | Koru`,
    description: methodology.detailParagraphs?.[0] ?? methodology.paragraphs?.[0],
  };
}

export default async function MethodologyPage({
  params,
}: MethodologyPageProps) {
  const { metodologia } = await params;
  const methodology = methodologies.find(
    (item) => item.slug === metodologia,
  );

  if (!methodology) {
    notFound();
  }

  const paragraphs = methodology.detailParagraphs ?? methodology.paragraphs ?? [];

  return (
    <main
      className="min-h-screen bg-[#f7f6f1]"
      style={{ fontFamily: "var(--font-montserrat)" }}
    >
      <section className="mx-auto w-full max-w-5xl px-6 py-12 md:px-10 md:py-16 lg:px-14 lg:py-20">
        <Link
          href="/como-acompanamos#metodologias-y-experiencias"
          className="inline-flex text-sm font-semibold uppercase tracking-[0.18em] text-[var(--complement-800)] transition hover:text-[var(--complement-900)]"
        >
          Metodologías y experiencias
        </Link>

        <header className="mt-8 max-w-4xl">
          <h1
            className="text-[clamp(3rem,9vw,6rem)] leading-[0.9] tracking-tight text-black"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            {methodology.title}
          </h1>
        </header>

        <div className="mt-12 max-w-4xl space-y-6 text-lg leading-relaxed text-black/80 md:text-xl">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </main>
  );
}