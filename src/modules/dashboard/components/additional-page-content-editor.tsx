"use client";

import { useMemo } from "react";

import { AdmisionesView } from "@/modules/admisiones/views/admisiones-view";
import { BlogContentPreview } from "@/modules/blog/components/blog-page-header";
import { ComunidadView } from "@/modules/comunidad/views/comunidad-view";
import { getCmsContentSlots, type CmsContentPageKey } from "@/modules/cms/content-page-config";
import { PageContentEditor } from "@/modules/dashboard/components/landing-content-editor";
import { LandingPageLayout } from "@/modules/landing/views/landing-page-layout";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";
import { ContactoView } from "@/app/(pages)/contacto/contacto-view";

type AdditionalPageContentEditorProps = {
  pageKey: CmsContentPageKey;
  initialTextMap: LandingTextMap;
};

const labels: Record<CmsContentPageKey, string> = {
  comunidad: "Comunidad",
  blog: "Blog",
  admisiones: "Admisiones",
  contacto: "Contacto",
};

export function AdditionalPageContentEditor({ pageKey, initialTextMap }: AdditionalPageContentEditorProps) {
  const slots = useMemo(() => getCmsContentSlots(pageKey), [pageKey]);
  const slug = `/${pageKey}`;

  return (
    <PageContentEditor
      initialTextMap={initialTextMap}
      slots={slots}
      pageSlug={slug}
      previewLabel={`Preview de ${labels[pageKey]}`}
      previewScale={0.76}
      renderPreview={({ textMap, selectedSlotId, onSelectSlot }) => {
        const bindings = {
          textMap,
          previewMode: true,
          selectedContentSlotId: selectedSlotId,
          onSelectContentSlot: onSelectSlot,
        };

        return (
          <LandingPageLayout textMap={textMap} previewMode hideChrome>
            {pageKey === "comunidad" ? <ComunidadView {...bindings} /> : null}
            {pageKey === "admisiones" ? <AdmisionesView {...bindings} /> : null}
            {pageKey === "contacto" ? <ContactoView {...bindings} /> : null}
            {pageKey === "blog" ? <BlogContentPreview {...bindings} /> : null}
          </LandingPageLayout>
        );
      }}
    />
  );
}