"use client";

import { CmsPageEditableCopy } from "@/modules/cms/components/cms-page-editable-copy";
import type { LandingPreviewBindings, LandingTextMap } from "@/modules/landing/types/landing-text";

type BlogPageHeaderProps = {
  textMap: LandingTextMap;
} & Pick<LandingPreviewBindings, "previewMode" | "selectedContentSlotId" | "onSelectContentSlot">;

export function BlogPageHeader({ textMap, previewMode, selectedContentSlotId, onSelectContentSlot }: BlogPageHeaderProps) {
  const editable = { page: "blog" as const, textMap, previewMode, selectedContentSlotId, onSelectContentSlot };
  return (
    <header className="mx-auto mb-8 max-w-5xl space-y-3">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight [font-family:var(--font-roboto-condensed)] md:text-4xl">
          <CmsPageEditableCopy as="span" slotId="blog.brand" {...editable} />
        </h1>
        <p className="text-2xl font-semibold italic tracking-wider [font-family:var(--font-indie-flower)] md:text-4xl">
          <CmsPageEditableCopy as="span" slotId="blog.title" {...editable} />
        </p>
      </div>
    </header>
  );
}

export function BlogContentPreview(props: BlogPageHeaderProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl bg-white px-6 pb-16 pt-10 md:px-10 lg:px-14">
      <BlogPageHeader {...props} />
      <div className="mx-auto flex max-w-5xl flex-wrap gap-2">
        {["Todos", "Novedades", "Comunidad"].map((label) => <span key={label} className="rounded-full border px-3 py-1.5 text-sm">{label}</span>)}
      </div>
      <div className="mx-auto mt-8 grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,54rem)_17.5rem]">
        <div className="space-y-8">
          {[1, 2].map((item) => <div key={item} className="grid gap-4 md:grid-cols-[290px_1fr]"><div className="aspect-square bg-slate-200" /><div className="space-y-3 py-3"><div className="h-7 w-3/4 rounded bg-slate-200" /><div className="h-4 w-full rounded bg-slate-100" /><div className="h-4 w-5/6 rounded bg-slate-100" /></div></div>)}
        </div>
        <aside className="space-y-3"><div className="h-6 w-32 rounded bg-slate-200" /><div className="h-48 bg-[#f7f3fb]" /></aside>
      </div>
    </main>
  );
}