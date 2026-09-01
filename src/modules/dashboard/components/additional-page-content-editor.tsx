"use client";

import { useMemo } from "react";

import { ContactoView } from "@/app/(pages)/contacto/contacto-view";
import { AdmisionesView } from "@/modules/admisiones/views/admisiones-view";
import { BlogContentPreview } from "@/modules/blog/components/blog-page-header";
import {
  getCmsContentSlots,
  getCmsImageSlots,
  type CmsContentPageKey,
} from "@/modules/cms/content-page-config";
import type { CmsImageMap } from "@/modules/cms/server/cms-image.repository";
import { ComunidadView } from "@/modules/comunidad/views/comunidad-view";
import { PageContentEditor } from "@/modules/dashboard/components/landing-content-editor";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";
import { LandingPageLayout } from "@/modules/landing/views/landing-page-layout";

type AdditionalPageContentEditorProps = {
  pageKey: CmsContentPageKey;
  initialTextMap: LandingTextMap;
  initialImageMap: CmsImageMap;
};

const labels: Record<CmsContentPageKey, string> = {
  comunidad: "Comunidad",
  blog: "Blog",
  admisiones: "Admisiones",
  contacto: "Contacto",
};

export function AdditionalPageContentEditor({
  pageKey,
  initialTextMap,
  initialImageMap,
}: AdditionalPageContentEditorProps) {
  const slots = useMemo(() => getCmsContentSlots(pageKey), [pageKey]);
  const imageSlots = useMemo(() => getCmsImageSlots(pageKey), [pageKey]);
  const slug = `/${pageKey}`;

  return (
    <PageContentEditor
      initialTextMap={initialTextMap}
      initialImageMap={initialImageMap}
      slots={slots}
      imageSlots={imageSlots}
      pageSlug={slug}
      previewLabel={`Preview de ${labels[pageKey]}`}
      previewScale={0.76}
      renderPreview={({
        textMap,
        imageMap,
        selectedSlotId,
        onSelectSlot,
      }) => {
        const bindings = {
          textMap,
          previewMode: true,
          selectedContentSlotId: selectedSlotId,
          onSelectContentSlot: onSelectSlot,
        };

        return (
          <LandingPageLayout textMap={textMap} previewMode hideChrome>
            {pageKey === "comunidad" ? (
              <ComunidadView {...bindings} imageMap={imageMap} />
            ) : null}
            {pageKey === "admisiones" ? <AdmisionesView {...bindings} /> : null}
            {pageKey === "contacto" ? <ContactoView {...bindings} /> : null}
            {pageKey === "blog" ? <BlogContentPreview {...bindings} /> : null}
          </LandingPageLayout>
        );
      }}
    />
  );
}
