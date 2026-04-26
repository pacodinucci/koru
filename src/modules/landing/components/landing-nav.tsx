import Image from "next/image";
import Link from "next/link";

export function LandingNav() {
  return (
    <header className="font-fira sticky top-0 z-20 bg-white backdrop-blur">
      <div className="flex w-full items-center justify-between px-5 pt-4 pb-0 md:px-8 lg:px-14 xl:px-20">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/branding/koru-logo.png"
            alt="Koru"
            width={1536}
            height={1024}
            className="h-16 w-auto"
            priority
          />
        </Link>

        <div className="hidden items-baseline gap-8 lg:flex pt-2">
          <nav className="flex items-center gap-9 text-[.8rem] font-semibold tracking-wider text-[#111]">
            <a href="#metodo" className="transition hover:opacity-70">
              Quienes somos
            </a>
            <a href="#niveles" className="transition hover:opacity-70">
              Cómo acompañamos
            </a>
            <a href="#comunidad" className="transition hover:opacity-70">
              Comunidad
            </a>
            <a href="#" className="transition hover:opacity-70">
              Escuela para familias
            </a>
            <a href="#" className="transition hover:opacity-70">
              Admisiones
            </a>
          </nav>

          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 text-[.8rem] font-semibold tracking-tight text-[#111] transition hover:opacity-70"
          >
            Log In
          </Link>
        </div>
      </div>
    </header>
  );
}
