"use client";

import { useMemo } from "react";

import { ContactoView } from "@/app/(pages)/contacto/contacto-view";
import { AdmisionesView } from "@/modules/admisiones/views/admisiones-view";
import { BlogContentPreview } from "@/modules/blog/components/blog-page-header";
import {
  CommunityAgreementsView,
  GroupDetailView,
  MethodologyDetailView,
  TeamApplicationView,
} from "@/modules/cms/components/child-page-content-views";
import {
  getCmsContentPage,
  getCmsContentSlots,
  getCmsImageSlots,
  type CmsContentPageKey,
} from "@/modules/cms/content-page-config";
import { slugifyCmsSegment } from "@/modules/cms/child-content-config";
import type { CmsImageMap } from "@/modules/cms/server/cms-image.repository";
import {
  accompanimentGroups,
  methodologies,
} from "@/modules/como-acompanamos/content-slots";
import { ComunidadView } from "@/modules/comunidad/views/comunidad-view";
import { PageContentEditor } from "@/modules/dashboard/components/landing-content-editor";
import { EvaluacionesView } from "@/modules/evaluaciones/views/evaluaciones-view";
import type { LandingTextMap } from "@/modules/landing/types/landing-text";
import { LandingPageLayout } from "@/modules/landing/views/landing-page-layout";

type AdditionalPageContentEditorProps = {
  pageKey: CmsContentPageKey;
  initialTextMap: LandingTextMap;
  initialImageMap: CmsImageMap;
};

export function AdditionalPageContentEditor({
  pageKey,
  initialTextMap,
  initialImageMap,
}: AdditionalPageContentEditorProps) {
  const slots = useMemo(() => getCmsContentSlots(pageKey), [pageKey]);
  const imageSlots = useMemo(() => getCmsImageSlots(pageKey), [pageKey]);
  const page = getCmsContentPage(pageKey);
  if (!page) return null;

  const group = page.slug.startsWith("/como-acompanamos/") &&
    !page.slug.startsWith("/como-acompanamos/metodologias/")
      ? accompanimentGroups.find(
          (item) => slugifyCmsSegment(item.title) === page.slug.split("/").at(-1),
        )
      : undefined;
  const methodology = page.slug.startsWith("/como-acompanamos/metodologias/")
    ? methodologies.find((item) => item.slug === page.slug.split("/").at(-1))
    : undefined;

  return (
    <PageContentEditor
      initialTextMap={initialTextMap}
      initialImageMap={initialImageMap}
      slots={slots}
      imageSlots={imageSlots}
      pageSlug={page.slug}
      previewLabel={`Preview de ${page.label}`}
      previewScale={0.76}
      renderPreview={({ textMap, imageMap, selectedSlotId, onSelectSlot }) => {
        const bindings = {
          textMap,
          previewMode: true,
          selectedContentSlotId: selectedSlotId,
          onSelectContentSlot: onSelectSlot,
        };

        return (
          <LandingPageLayout textMap={textMap} previewMode hideChrome>
            {pageKey === "comunidad" ? <ComunidadView {...bindings} imageMap={imageMap} /> : null}
            {pageKey === "admisiones" ? <AdmisionesView {...bindings} /> : null}
            {pageKey === "contacto" ? <ContactoView {...bindings} /> : null}
            {pageKey === "blog" ? <BlogContentPreview {...bindings} /> : null}
            {page.slug === "/comunidad/acuerdos" ? <CommunityAgreementsView pageKey={pageKey} {...bindings} /> : null}
            {page.slug === "/unete-al-equipo" ? <TeamApplicationView pageKey={pageKey} {...bindings} /> : null}
            {page.slug === "/evaluaciones" ? <EvaluacionesView {...bindings} imageMap={imageMap} /> : null}
            {group ? <GroupDetailView pageKey={pageKey} group={group} {...bindings} imageMap={imageMap} /> : null}
            {methodology ? <MethodologyDetailView pageKey={pageKey} methodology={methodology} {...bindings} imageMap={imageMap} /> : null}
          </LandingPageLayout>
        );
      }}
    />
  );
}
