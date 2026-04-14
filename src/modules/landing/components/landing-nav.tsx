import Image from "next/image";
import Link from "next/link";

export function LandingNav() {
  return (
    <header className="font-fira sticky top-0 z-20 border-b border-black/10 bg-white backdrop-blur">
      <div className="flex w-full items-center justify-between px-5 pt-2 pb-0 md:px-8 lg:px-14 xl:px-20">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/branding/koru-logo.png"
            alt="Koru"
            width={1536}
            height={1024}
            className="h-14 w-auto"
            priority
          />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <nav className="flex items-center gap-9 text-[.8rem] font-semibold tracking-tight text-[#111]">
            <a href="#" className="transition hover:opacity-70">
              Home
            </a>
            <a href="#metodo" className="transition hover:opacity-70">
              Nosotros
            </a>
            <a href="#niveles" className="transition hover:opacity-70">
              Niveles
            </a>
            <a href="#comunidad" className="transition hover:opacity-70">
              Nuestra Visión
            </a>
            <a href="#" className="transition hover:opacity-70">
              Blog
            </a>
          </nav>

          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 text-[.8rem] font-semibold tracking-tight text-[#111] transition hover:opacity-70"
          >
            {/* <CircleUserRound className="h-4 w-4" /> */}
            Log In
          </Link>

          <a
            href="#tour"
            className="inline-flex py-2 items-center rounded-sm border border-(--brand-700) bg-(--brand-300) px-4 text-[.8rem] font-semibold tracking-tight text-[var(--brand-900)] transition hover:bg-[var(--brand-100)]"
          >
            Haz una donación
          </a>
        </div>
      </div>
    </header>
  );
}
