import Link from "next/link";
import { CircleUserRound } from "lucide-react";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-[#f2f2f2]/95 backdrop-blur">
      <div className="flex w-full items-center justify-between px-5 py-4 md:px-8 lg:px-14 xl:px-20">
        <Link href="/" className="inline-flex items-end">
          <span className="text-4xl leading-none font-semibold tracking-tight text-[#1d1d1f]">
            KORU
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <nav className="flex items-center gap-9 text-[1.95rem] font-semibold tracking-tight text-[#111]">
            <a href="#" className="transition hover:opacity-70">
              Home
            </a>
            <a href="#metodo" className="transition hover:opacity-70">
              About
            </a>
            <a href="#niveles" className="transition hover:opacity-70">
              Studios
            </a>
            <a href="#comunidad" className="transition hover:opacity-70">
              Our Promise
            </a>
            <a href="#" className="transition hover:opacity-70">
              Blog
            </a>
          </nav>

          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 text-[1.95rem] font-semibold tracking-tight text-[#111] transition hover:opacity-70"
          >
            <CircleUserRound className="h-6 w-6" />
            Log In
          </Link>

          <a
            href="#tour"
            className="inline-flex h-12 items-center rounded-full border border-black/65 bg-[#ecee86] px-7 text-[1.95rem] font-semibold tracking-tight text-[#1a1a1a] transition hover:brightness-95"
          >
            Make a donation
          </a>
        </div>
      </div>
    </header>
  );
}
