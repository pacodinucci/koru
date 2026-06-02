import Image from "next/image";
import Link from "next/link";

type AuthSplitShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function AuthSplitShell({
  title,
  description,
  children,
  footer,
}: AuthSplitShellProps) {
  return (
    <main className="grid min-h-screen w-full bg-[#fbfaf4] [font-family:var(--font-montserrat)] lg:grid-cols-2">
      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-[420px]">
          <Link
            href="/"
            className="mb-12 inline-flex text-sm font-semibold tracking-[0.35em] text-[var(--complement-900)] uppercase"
          >
            Koru
          </Link>

          <div className="space-y-3">
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-[#1f2610] sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-sm text-sm leading-6 text-[#66704a]">
              {description}
            </p>
          </div>

          <div className="mt-10">{children}</div>

          <div className="mt-8 text-sm text-[#66704a]">{footer}</div>
        </div>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <Image
          src="/assets/img3.jpg"
          alt="Niños jugando al aire libre en Koru"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f2610]/45 via-transparent to-transparent" />
      </section>
    </main>
  );
}
