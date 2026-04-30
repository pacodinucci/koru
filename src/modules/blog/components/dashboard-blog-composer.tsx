"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useState } from "react";
import { BlogPostStatus } from "@prisma/client";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImagesIcon,
  ListIcon,
  ListOrderedIcon,
  PenLineIcon,
  PilcrowIcon,
  QuoteIcon,
  VideoIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDashboardEditorPanel } from "@/modules/dashboard/components/dashboard-editor-panel";
import {
  NovelBlogEditor,
  type NovelBlogEditorActions,
} from "@/modules/blog/components/novel-blog-editor";
import { createBlogPostAction } from "@/modules/blog/server/blog.actions";

type DashboardBlogComposerProps = {
  ok?: string;
  error?: string;
};

export function DashboardBlogComposer({ ok, error }: DashboardBlogComposerProps) {
  const formId = useId();
  const { portalTarget, setOpen } = useDashboardEditorPanel();
  const [editorActions, setEditorActions] = useState<NovelBlogEditorActions | null>(null);

  useEffect(() => {
    setOpen(true);
  }, [setOpen]);

  const panel = portalTarget
    ? createPortal(
        <aside className="flex h-full min-h-0 flex-col">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Configuracion del post
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Nuevo post</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {ok ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {ok}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                Insertar contenido
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertParagraph()}>
                  <PilcrowIcon className="h-3.5 w-3.5" />
                  Texto
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertHeading1()}>
                  <Heading1Icon className="h-3.5 w-3.5" />
                  H1
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertHeading2()}>
                  <Heading2Icon className="h-3.5 w-3.5" />
                  H2
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertHeading3()}>
                  <Heading3Icon className="h-3.5 w-3.5" />
                  H3
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertBulletList()}>
                  <ListIcon className="h-3.5 w-3.5" />
                  Lista
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertOrderedList()}>
                  <ListOrderedIcon className="h-3.5 w-3.5" />
                  Numerada
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertQuote()}>
                  <QuoteIcon className="h-3.5 w-3.5" />
                  Cita
                </Button>
                <Button type="button" variant="outline" size="sm" disabled>
                  <VideoIcon className="h-3.5 w-3.5" />
                  Video
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                Alineacion
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.alignLeft()}>
                  <AlignLeftIcon className="h-3.5 w-3.5" />
                  Izquierda
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.alignCenter()}>
                  <AlignCenterIcon className="h-3.5 w-3.5" />
                  Centro
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.alignRight()}>
                  <AlignRightIcon className="h-3.5 w-3.5" />
                  Derecha
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.alignJustify()}>
                  <AlignJustifyIcon className="h-3.5 w-3.5" />
                  Justificar
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                Imagenes
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertMosaic3()}>
                  <ImagesIcon className="h-3.5 w-3.5" />
                  Masonry x3
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertMosaic4()}>
                  <ImagesIcon className="h-3.5 w-3.5" />
                  Masonry x4
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertImageOriginal()}>
                  <ImagesIcon className="h-3.5 w-3.5" />
                  Original
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertImageFixedWidth()}>
                  <ImagesIcon className="h-3.5 w-3.5" />
                  Ancho fijo
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertImageFixedHeight()}>
                  <ImagesIcon className="h-3.5 w-3.5" />
                  Alto fijo
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertGallery2()}>
                  <ImagesIcon className="h-3.5 w-3.5" />
                  Tira x2
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertGallery3()}>
                  <ImagesIcon className="h-3.5 w-3.5" />
                  Tira x3
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => editorActions?.insertGallery4()}>
                  <ImagesIcon className="h-3.5 w-3.5" />
                  Tira x4
                </Button>
              </div>
            </div>
          </div>

          <div className="grid h-14 grid-cols-2 border-t border-slate-200">
            <button
              type="submit"
              form={formId}
              name="status"
              value={BlogPostStatus.DRAFT}
              className="block h-full w-full cursor-pointer rounded-none border-0 transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "#5b3f99",
                color: "#ffffff",
              }}
            >
              Guardar Borrador
            </button>
            <button
              type="submit"
              form={formId}
              name="status"
              value={BlogPostStatus.PUBLISHED}
              className="block h-full w-full cursor-pointer rounded-none border-0 transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "#059669",
                color: "#ffffff",
              }}
            >
              Publicar Post
            </button>
          </div>
        </aside>,
        portalTarget,
      )
    : null;

  return (
    <>
      <form id={formId} action={createBlogPostAction} className="space-y-3">
        <input type="hidden" name="dashboardPath" value="/dashboard/blog" />
        <input type="hidden" name="title" value="Titulo del post" />
        <section className="rounded-xl border border-slate-200 bg-white">
          <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
            <PenLineIcon className="h-4 w-4" />
            <h2 className="text-base font-semibold">Nuevo post</h2>
          </header>
          <div className="p-3">
            <NovelBlogEditor controlsInPanel onReady={setEditorActions} />
          </div>
        </section>
      </form>
      {panel}
    </>
  );
}

