"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useState } from "react";
import { BlogPostStatus, BlogPostVisibility } from "@prisma/client";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDashboardEditorPanel } from "@/modules/dashboard/components/dashboard-editor-panel";
import {
  NovelBlogEditor,
  type NovelBlogEditorActions,
} from "@/modules/blog/components/novel-blog-editor";
import {
  createBlogPostAction,
  updateBlogPostAction,
} from "@/modules/blog/server/blog.actions";

const groupTagColorClasses = [
  {
    selected: "border-emerald-600 bg-emerald-600 text-white",
    inactive: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  {
    selected: "border-purple-600 bg-purple-600 text-white",
    inactive: "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
  },
  {
    selected: "border-orange-500 bg-orange-500 text-white",
    inactive: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
  },
  {
    selected: "border-sky-600 bg-sky-600 text-white",
    inactive: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
  },
];

type DashboardBlogComposerProps = {
  tagOptions: {
    groups: Array<{ id: string; name: string; slug: string }>;
    customTags: Array<{ id: string; name: string; slug: string }>;
  };
  editingPost?: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    contentBlocks: unknown;
    status: BlogPostStatus;
    visibility: BlogPostVisibility;
    tags: Array<{
      tag: {
        name: string;
        type: "GROUP" | "CUSTOM";
        groupId: string | null;
      };
    }>;
  };
};

export function DashboardBlogComposer({
  tagOptions,
  editingPost,
}: DashboardBlogComposerProps) {
  const formId = useId();
  const { portalTarget, setOpen } = useDashboardEditorPanel();
  const [editorActions, setEditorActions] = useState<NovelBlogEditorActions | null>(null);
  const isEditing = Boolean(editingPost);
  const [visibility, setVisibility] = useState<BlogPostVisibility>(
    editingPost?.visibility ?? BlogPostVisibility.PUBLIC,
  );
  const initialSelectedGroupIds = new Set(
    editingPost?.tags
      .filter((postTag) => postTag.tag.type === "GROUP" && postTag.tag.groupId)
      .map((postTag) => postTag.tag.groupId as string) ?? [],
  );
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    initialSelectedGroupIds,
  );
  const customTagValue =
    editingPost?.tags
      .filter((postTag) => postTag.tag.type === "CUSTOM")
      .map((postTag) => postTag.tag.name)
      .join(", ") ?? "";

  useEffect(() => {
    setOpen(true);
  }, [setOpen]);

  function toggleGroupTag(groupId: string) {
    setSelectedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  const panel = portalTarget
    ? createPortal(
        <aside className="flex h-full min-h-0 flex-col">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Configuracion del post
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {isEditing ? "Editar post" : "Nuevo post"}
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
      <form
        id={formId}
        action={isEditing ? updateBlogPostAction : createBlogPostAction}
        className="space-y-3"
      >
        <input
          type="hidden"
          name="dashboardPath"
          value={isEditing && editingPost ? `/dashboard/blog/${editingPost.id}/edit` : "/dashboard/blog"}
        />
        {editingPost ? (
          <>
            <input type="hidden" name="postId" value={editingPost.id} />
            <input type="hidden" name="slug" value={editingPost.slug} />
          </>
        ) : null}
        <section className="rounded-xl border border-slate-200 bg-white">
          <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
            <PenLineIcon className="h-4 w-4" />
            <h2 className="text-base font-semibold">
              {isEditing ? "Editar post" : "Nuevo post"}
            </h2>
          </header>
          <div className="space-y-4 p-3">
            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              <div className="space-y-1.5">
                <label htmlFor={`${formId}-title`} className="text-sm font-medium text-slate-700">
                  Titulo
                </label>
                <Input
                  id={`${formId}-title`}
                  name="title"
                  required
                  minLength={4}
                  maxLength={180}
                  defaultValue={editingPost?.title}
                  placeholder="Ej: Como escalar el dashboard del blog"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor={`${formId}-excerpt`} className="text-sm font-medium text-slate-700">
                  Resumen
                </label>
                <Textarea
                  id={`${formId}-excerpt`}
                  name="excerpt"
                  required
                  minLength={8}
                  maxLength={220}
                  rows={3}
                  defaultValue={editingPost?.excerpt}
                  placeholder="Resumen corto que se muestra en la lista del blog"
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-slate-700">Audiencia</p>
                <input type="hidden" name="visibility" value={visibility} />
                <div className="grid w-full max-w-[260px] overflow-hidden rounded-lg border border-emerald-600 grid-cols-2">
                  <button
                    type="button"
                    aria-pressed={visibility === BlogPostVisibility.PUBLIC}
                    onClick={() => setVisibility(BlogPostVisibility.PUBLIC)}
                    className={`h-9 px-3 text-sm font-semibold tracking-wide transition-colors ${
                      visibility === BlogPostVisibility.PUBLIC
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    PUBLICO
                  </button>
                  <button
                    type="button"
                    aria-pressed={visibility === BlogPostVisibility.MEMBERS}
                    onClick={() => setVisibility(BlogPostVisibility.MEMBERS)}
                    className={`h-9 border-l border-emerald-600 px-3 text-sm font-semibold tracking-wide transition-colors ${
                      visibility === BlogPostVisibility.MEMBERS
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    PRIVADO
                  </button>
                </div>
              </div>

            </div>

            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Etiquetas</p>
                <p className="text-xs text-slate-500">
                  Usá grupos activos y etiquetas custom separadas por coma.
                </p>
              </div>

              {tagOptions.groups.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Grupos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tagOptions.groups
                      .filter((group) => selectedGroupIds.has(group.id))
                      .map((group) => (
                        <input
                          key={group.id}
                          type="hidden"
                          name="groupTagIds"
                          value={group.id}
                        />
                      ))}
                    {tagOptions.groups.map((group, index) => {
                      const isSelected = selectedGroupIds.has(group.id);
                      const color =
                        groupTagColorClasses[index % groupTagColorClasses.length];
                      return (
                        <button
                          key={group.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleGroupTag(group.id)}
                          className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium transition-colors ${
                            isSelected
                              ? color.selected
                              : color.inactive
                          }`}
                        >
                          {group.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label
                  htmlFor={`${formId}-custom-tags`}
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Custom
                </label>
                <Input
                  id={`${formId}-custom-tags`}
                  name="customTags"
                  defaultValue={customTagValue}
                  placeholder="Ej: Novedades, Familias, Talleres"
                  list={`${formId}-custom-tags-options`}
                />
                <datalist id={`${formId}-custom-tags-options`}>
                  {tagOptions.customTags.map((tag) => (
                    <option key={tag.id} value={tag.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <NovelBlogEditor
              controlsInPanel
              onReady={setEditorActions}
              initialJson={
                editingPost?.contentBlocks
                  ? JSON.stringify(editingPost.contentBlocks)
                  : undefined
              }
              initialHtml={editingPost?.content}
            />
          </div>
        </section>
      </form>
      {panel}
    </>
  );
}

