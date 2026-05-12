"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getLandingFieldFontSize,
  type LandingPreviewBindings,
  type LandingTextMap,
} from "@/modules/landing/types/landing-text";

type LandingFooterProps = {
  textMap: LandingTextMap;
} & LandingPreviewBindings;

function selectableClass(active: boolean, previewMode?: boolean) {
  return cn(
    previewMode && "cursor-pointer rounded-sm transition",
    active && "ring-2 ring-primary/50",
  );
}

export function LandingFooter({
  textMap,
  previewMode,
  selectedFieldId,
  onSelectField,
}: LandingFooterProps) {
  return (
    <footer className="border-t border-[#d8d3a8] bg-[#d8cfb6]">
      <div className="grid w-full gap-10 px-3 py-14 md:grid-cols-2 md:px-5 lg:grid-cols-4 lg:gap-8 lg:px-7">
        <section>
          <h3
            className={cn(
              "text-3xl font-semibold tracking-tight text-black",
              selectableClass(selectedFieldId === "footer-brand", previewMode),
            )}
            onClick={() => onSelectField?.("footer-brand")}
            style={{
              fontSize: `${getLandingFieldFontSize(textMap, "footer-brand", 38)}px`,
            }}
          >
            {textMap["footer-brand"]}
          </h3>

          <h4 className="mt-8 text-3xl font-semibold tracking-tight text-black">
            Quick Links
          </h4>
          <nav className="mt-4 space-y-2.5 text-[1.5rem] leading-none text-black/95">
            <a href="#">Home</a>
            <a href="#metodo" className="block">
              About
            </a>
            <a href="#niveles" className="block">
              Studios
            </a>
            <a href="#comunidad" className="block">
              Our Promise
            </a>
            <a href="#tour" className="block">
              Haz una donación
            </a>
          </nav>
        </section>

        <section>
          <h4
            className={cn(
              "text-3xl font-semibold tracking-tight text-black",
              selectableClass(selectedFieldId === "footer-campus", previewMode),
            )}
            onClick={() => onSelectField?.("footer-campus")}
            style={{
              fontSize: `${getLandingFieldFontSize(textMap, "footer-campus", 38)}px`,
            }}
          >
            {textMap["footer-campus"]}
          </h4>
          <p className="mt-6 text-[1.5rem] leading-[1.3] text-black/95">
            Calle Principal 115 A
            <br />
            Centro
            <br />
            64650
          </p>
          <p className="mt-6 text-[1.5rem] leading-[1.3] text-black/95">
            Whatsapp:
            <br />
            (+52) 81 1182 7264
          </p>
          <p
            className={cn(
              "mt-6 text-[1.5rem] leading-[1.3] text-black/95",
              selectableClass(selectedFieldId === "footer-mail", previewMode),
            )}
            onClick={() => onSelectField?.("footer-mail")}
            style={{
              fontSize: `${getLandingFieldFontSize(textMap, "footer-mail", 24)}px`,
            }}
          >
            General Inquiries:
            <br />
            {textMap["footer-mail"]}
          </p>
        </section>

        <section>
          <h4 className="text-3xl font-semibold tracking-tight text-black">
            Follow
          </h4>
          <p className="mt-12 text-[1.5rem] leading-tight text-black/95">
            Sign up to stay up to date
          </p>
          <label
            htmlFor="footer-email"
            className="mt-2 block text-[1.5rem] font-semibold leading-none text-black"
          >
            Email *
          </label>
          <form className="mt-4 flex max-w-[30rem] overflow-hidden rounded-xl border border-black/40">
            <input
              id="footer-email"
              type="email"
              className="h-12 w-full bg-[#ececec] px-4 text-[1.3rem] outline-none"
            />
            <button
              type="button"
              className="h-12 shrink-0 bg-black px-6 text-[1.5rem] font-semibold text-white"
            >
              Subscribe
            </button>
          </form>

          <p
            className={cn(
              "mt-8 text-[1.25rem] text-black/95",
              selectableClass(selectedFieldId === "footer-legal", previewMode),
            )}
            onClick={() => onSelectField?.("footer-legal")}
            style={{
              fontSize: `${getLandingFieldFontSize(textMap, "footer-legal", 20)}px`,
            }}
          >
            {textMap["footer-legal"]}
          </p>
        </section>

        <section className="pt-16 lg:pt-0">
          <nav className="space-y-6 text-[1.5rem] font-semibold leading-none text-black">
            <Link href="#">LinkedIn</Link>
            <Link href="#">YouTube</Link>
            <Link href="#">Instagram</Link>
          </nav>
        </section>
      </div>
    </footer>
  );
}
