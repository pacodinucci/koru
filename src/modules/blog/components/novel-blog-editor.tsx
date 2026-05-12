"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  PilcrowIcon,
  QuoteIcon,
} from "lucide-react";
import {
  Command,
  EditorBubble,
  EditorBubbleItem,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  ImageResizer,
  Placeholder,
  StarterKit,
  UpdatedImage,
  createSuggestionItems,
  handleCommandNavigation,
  renderItems,
  useEditor,
  type EditorInstance,
  type JSONContent,
  type SuggestionItem,
} from "novel";
import TextAlign from "@tiptap/extension-text-align";
import { Node } from "@tiptap/core";

const DEFAULT_CONTENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Empieza a escribir el contenido del post..." }],
    },
  ],
};

type NovelBlogEditorProps = {
  jsonInputName?: string;
  htmlInputName?: string;
  controlsInPanel?: boolean;
  onReady?: (actions: NovelBlogEditorActions | null) => void;
  onHtmlChange?: (html: string) => void;
};

export type NovelBlogEditorActions = {
  insertParagraph: () => void;
  insertHeading1: () => void;
  insertHeading2: () => void;
  insertHeading3: () => void;
  insertBulletList: () => void;
  insertOrderedList: () => void;
  insertQuote: () => void;
  alignLeft: () => void;
  alignCenter: () => void;
  alignRight: () => void;
  alignJustify: () => void;
  insertImageOriginal: () => void;
  insertImageFixedWidth: () => void;
  insertImageFixedHeight: () => void;
  insertGallery2: () => void;
  insertGallery3: () => void;
  insertGallery4: () => void;
  insertMosaic3: () => boolean;
  insertMosaic4: () => boolean;
};

type ImageInsertMode = "original" | "preset-width" | "preset-height";
type MasonryLayout = "masonry-3" | "masonry-4";
type MasonryItem = {
  slot: number;
  src: string;
  alt?: string;
};

const PRESET_WIDTH = 960;
const PRESET_HEIGHT = 520;
const MASONRY_PLACEHOLDER = "/blog-placeholder.svg";

const MasonryGalleryNode = Node.create({
  name: "masonryGallery",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      layout: {
        default: "masonry-4",
      },
      items: {
        default: [],
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="masonry-gallery"]',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          const layout = element.getAttribute("data-layout") ?? "masonry-4";
          const rawItems = element.getAttribute("data-items") ?? "[]";
          let items: MasonryItem[] = [];
          try {
            items = JSON.parse(rawItems) as MasonryItem[];
          } catch {
            items = [];
          }

          return { layout, items };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const layout = String(node.attrs.layout ?? "masonry-4") as MasonryLayout;
    const items = Array.isArray(node.attrs.items)
      ? (node.attrs.items as MasonryItem[])
      : [];

    const attrs = {
      "data-type": "masonry-gallery",
      "data-layout": layout,
      "data-items": JSON.stringify(items),
    };

    const children = items.map((item) => [
      "img",
      {
        src: item.src,
        alt: item.alt ?? `Imagen ${item.slot}`,
        "data-slot": String(item.slot),
      },
    ]);

    return ["div", attrs, ...children];
  },
});

function getGallerySquareSize(cols: number) {
  if (cols === 2) {
    return 220;
  }
  if (cols === 3) {
    return 180;
  }
  return 150;
}

type GalleryLayout = "strip" | "mosaic-hero-3" | "mosaic-asym-4";

function getGalleryLayoutSlotSize(
  layout: GalleryLayout,
  cols: number,
  slot: number,
) {
  if (layout === "mosaic-hero-3") {
    if (slot === 1) {
      return { width: 560, height: 300 };
    }
    return { width: 270, height: 210 };
  }

  if (layout === "mosaic-asym-4") {
    if (slot === 1) {
      return { width: 340, height: 260 };
    }
    if (slot === 2) {
      return { width: 220, height: 260 };
    }
    if (slot === 3) {
      return { width: 220, height: 180 };
    }
    return { width: 340, height: 180 };
  }

  const size = getGallerySquareSize(cols);
  return { width: size, height: size };
}

function buildPlaceholderSrc(label: string) {
  return `/blog-placeholder.svg?slot=${encodeURIComponent(label)}`;
}

const BlogImage = UpdatedImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      galleryId: {
        default: null,
        renderHTML: (attributes: { galleryId?: string | null }) => {
          if (!attributes.galleryId) {
            return {};
          }
          return { "data-gallery-id": attributes.galleryId };
        },
      },
      galleryCols: {
        default: null,
        renderHTML: (attributes: { galleryCols?: number | null }) => {
          if (!attributes.galleryCols) {
            return {};
          }
          return { "data-gallery-cols": String(attributes.galleryCols) };
        },
      },
      gallerySlot: {
        default: null,
        renderHTML: (attributes: { gallerySlot?: number | null }) => {
          if (!attributes.gallerySlot) {
            return {};
          }
          return { "data-gallery-slot": String(attributes.gallerySlot) };
        },
      },
      galleryLayout: {
        default: "strip",
        renderHTML: (attributes: { galleryLayout?: string | null }) => {
          if (!attributes.galleryLayout) {
            return {};
          }
          return { "data-gallery-layout": attributes.galleryLayout };
        },
      },
      isPlaceholder: {
        default: false,
        renderHTML: (attributes: { isPlaceholder?: boolean }) => {
          if (!attributes.isPlaceholder) {
            return {};
          }
          return { "data-placeholder": "true" };
        },
      },
      imgAlign: {
        default: "center",
        renderHTML: (attributes: { imgAlign?: string | null }) => {
          if (!attributes.imgAlign) {
            return {};
          }
          return { "data-img-align": attributes.imgAlign };
        },
      },
    };
  },
});

function CommandLabel({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 rounded-md border p-1.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function SelectedImagePanel() {
  const { editor } = useEditor();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const rerender = () => setTick((current) => current + 1);

    editor.on("selectionUpdate", rerender);
    editor.on("update", rerender);

    return () => {
      editor.off("selectionUpdate", rerender);
      editor.off("update", rerender);
    };
  }, [editor]);

  if (!editor || !editor.isActive("image")) {
    return null;
  }

  const attrs = editor.getAttributes("image") as {
    width?: number | string | null;
    height?: number | string | null;
    isPlaceholder?: boolean;
    imgAlign?: string | null;
  };

  if (attrs.isPlaceholder) {
    return null;
  }

  const widthValue = attrs.width ? String(attrs.width) : "";
  const heightValue = attrs.height ? String(attrs.height) : "";
  const imgAlignValue =
    attrs.imgAlign === "left" || attrs.imgAlign === "right" ? attrs.imgAlign : "center";

  return (
    <div className="border-t bg-muted/20 px-3 py-2">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Imagen seleccionada</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-7 items-center rounded-md border bg-background px-2 text-xs"
          onClick={() =>
            editor.chain().focus().updateAttributes("image", { imgAlign: "left" }).run()
          }
        >
          Izquierda
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center rounded-md border bg-background px-2 text-xs"
          onClick={() =>
            editor.chain().focus().updateAttributes("image", { imgAlign: "center" }).run()
          }
        >
          Centro
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center rounded-md border bg-background px-2 text-xs"
          onClick={() =>
            editor.chain().focus().updateAttributes("image", { imgAlign: "right" }).run()
          }
        >
          Derecha
        </button>

        <button
          type="button"
          className="inline-flex h-7 items-center rounded-md border bg-background px-2 text-xs"
          onClick={() =>
            editor.chain().focus().updateAttributes("image", { width: null, height: null }).run()
          }
        >
          Original
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center rounded-md border bg-background px-2 text-xs"
          onClick={() =>
            editor
              .chain()
              .focus()
              .updateAttributes("image", { width: PRESET_WIDTH, height: null })
              .run()
          }
        >
          Ancho predeterminado
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center rounded-md border bg-background px-2 text-xs"
          onClick={() =>
            editor
              .chain()
              .focus()
              .updateAttributes("image", { width: null, height: PRESET_HEIGHT })
              .run()
          }
        >
          Alto predeterminado
        </button>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">W</span>
          <input
            type="number"
            min={100}
            max={2000}
            className="h-7 w-20 rounded-md border bg-background px-2"
            value={widthValue}
            onChange={(event) => {
              const value = Number.parseInt(event.target.value || "", 10);
              editor
                .chain()
                .focus()
                .updateAttributes("image", {
                  width: Number.isFinite(value) ? value : null,
                  imgAlign: imgAlignValue,
                })
                .run();
            }}
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">H</span>
          <input
            type="number"
            min={100}
            max={2000}
            className="h-7 w-20 rounded-md border bg-background px-2"
            value={heightValue}
            onChange={(event) => {
              const value = Number.parseInt(event.target.value || "", 10);
              editor
                .chain()
                .focus()
                .updateAttributes("image", {
                  height: Number.isFinite(value) ? value : null,
                  imgAlign: imgAlignValue,
                })
                .run();
            }}
          />
        </div>
      </div>
    </div>
  );
}

function InlineTextAlignToolbar() {
  const { editor } = useEditor();

  if (!editor) {
    return null;
  }

  const actions = [
    { key: "left", label: "Izquierda", icon: <AlignLeftIcon className="h-3.5 w-3.5" /> },
    { key: "center", label: "Centro", icon: <AlignCenterIcon className="h-3.5 w-3.5" /> },
    { key: "right", label: "Derecha", icon: <AlignRightIcon className="h-3.5 w-3.5" /> },
    { key: "justify", label: "Justificar", icon: <AlignJustifyIcon className="h-3.5 w-3.5" /> },
  ] as const;

  return (
    <div contentEditable={false} className="sticky top-0 z-20 border-b bg-background/95 px-3 py-2 backdrop-blur">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => editor.chain().focus().setTextAlign(action.key).run()}
            className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2.5 text-xs font-medium hover:bg-muted"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function createGalleryId() {
  return `gallery-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function NovelBlogEditor({
  jsonInputName = "contentJson",
  htmlInputName = "contentHtml",
  controlsInPanel = false,
  onReady,
  onHtmlChange,
}: NovelBlogEditorProps) {
  const [jsonValue, setJsonValue] = useState<string>(JSON.stringify(DEFAULT_CONTENT));
  const [htmlValue, setHtmlValue] = useState<string>(
    "<p>Empieza a escribir el contenido del post...</p>",
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string>("");
  const [singleImageMode, setSingleImageMode] = useState<ImageInsertMode>("original");
  const [pendingPlaceholderNode, setPendingPlaceholderNode] = useState<{
    nodePos: number;
    cols: number;
    width?: number;
    height?: number;
  } | null>(null);
  const [pendingMasonrySlot, setPendingMasonrySlot] = useState<{
    nodePos: number;
    slot: number;
  } | null>(null);

  const editorRef = useRef<EditorInstance | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const resizeStateRef = useRef<{
    nodePos: number;
    startX: number;
    startWidth: number;
    edge: "left" | "right";
    keepSquare: boolean;
  } | null>(null);

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/uploads/blog", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let backendMessage = "No pudimos subir la imagen.";
      try {
        const payload = (await response.json()) as { error?: string };
        if (payload?.error) {
          backendMessage = payload.error;
        }
      } catch {
        // ignore parsing error
      }
      throw new Error(backendMessage);
    }

    const data = (await response.json()) as { ok?: boolean; url?: string; error?: string };
    if (!data.ok || !data.url) {
      throw new Error(data.error || "No pudimos subir la imagen.");
    }

    return data.url;
  }

  function insertGalleryPlaceholders(
    editor: EditorInstance,
    cols: 2 | 3 | 4,
    layout: GalleryLayout = "strip",
  ) {
    const galleryId = createGalleryId();

    const nodes = Array.from({ length: cols }).map((_, index) => {
      const slot = index + 1;
      const { width, height } = getGalleryLayoutSlotSize(layout, cols, slot);

      return {
        type: "image",
        attrs: {
          src: buildPlaceholderSrc(`Imagen ${slot}`),
          galleryId,
          galleryCols: cols,
          gallerySlot: slot,
          galleryLayout: layout,
          isPlaceholder: true,
          width,
          height,
          imgAlign: "center",
        },
      };
    });

    const chain = editor.chain().focus();
    nodes.forEach((node) => chain.insertContent(node));
    chain.insertContent({ type: "paragraph" }).run();
  }

  const handleInsertGalleryStrip = useCallback((
    cols: 2 | 3 | 4,
    layout: GalleryLayout = "strip",
  ) => {
    if (!editorRef.current) {
      setUploadNotice("Haz click dentro del editor antes de insertar la tira.");
      return;
    }

    setUploadNotice("");
    insertGalleryPlaceholders(editorRef.current, cols, layout);
  }, []);

  const handleInsertSingleImage = useCallback((mode: ImageInsertMode) => {
    if (!editorRef.current) {
      setUploadNotice("Haz click dentro del editor antes de insertar una imagen.");
      return;
    }

    setUploadNotice("");
    setPendingPlaceholderNode(null);
    setPendingMasonrySlot(null);
    setSingleImageMode(mode);
    imageFileInputRef.current?.click();
  }, []);

  const handleInsertMasonryLayout = useCallback((layout: MasonryLayout) => {
    if (!editorRef.current) {
      setUploadNotice("Haz click dentro del editor antes de insertar el mosaico.");
      return false;
    }

    const total = layout === "masonry-3" ? 3 : 4;
    const items: MasonryItem[] = Array.from({ length: total }).map((_, index) => ({
      slot: index + 1,
      src: `${MASONRY_PLACEHOLDER}?slot=${index + 1}`,
      alt: `Imagen ${index + 1}`,
    }));

    setUploadNotice("");
    const editor = editorRef.current;
    const endPos = editor.state.doc.content.size;
    const inserted = editor.commands.insertContentAt(endPos, {
      type: "masonryGallery",
      attrs: {
        layout,
        items,
      },
    });

    if (!inserted) {
      setUploadNotice("No pudimos insertar el bloque masonry en esa posicion.");
      return false;
    }

    editor.commands.insertContentAt(editor.state.doc.content.size, {
      type: "paragraph",
    });

    editor.chain().focus("end").run();
    return true;
  }, []);

  function runEditorCommand(command: (editor: EditorInstance) => void) {
    if (!editorRef.current) {
      setUploadNotice("Haz click dentro del editor antes de insertar contenido.");
      return;
    }

    setUploadNotice("");
    command(editorRef.current);
  }

  const editorActions = useMemo<NovelBlogEditorActions>(
    () => ({
      insertParagraph: () =>
        runEditorCommand((editor) => {
          editor.chain().focus().insertContent({ type: "paragraph" }).run();
        }),
      insertHeading1: () =>
        runEditorCommand((editor) => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Nuevo titulo H1" }],
            })
            .run();
        }),
      insertHeading2: () =>
        runEditorCommand((editor) => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Nuevo titulo H2" }],
            })
            .run();
        }),
      insertHeading3: () =>
        runEditorCommand((editor) => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "heading",
              attrs: { level: 3 },
              content: [{ type: "text", text: "Nuevo titulo H3" }],
            })
            .run();
        }),
      insertBulletList: () =>
        runEditorCommand((editor) => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "bulletList",
              content: [{ type: "listItem", content: [{ type: "paragraph" }] }],
            })
            .run();
        }),
      insertOrderedList: () =>
        runEditorCommand((editor) => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "orderedList",
              content: [{ type: "listItem", content: [{ type: "paragraph" }] }],
            })
            .run();
        }),
      insertQuote: () =>
        runEditorCommand((editor) => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "blockquote",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Nueva cita" }] }],
            })
            .run();
        }),
      alignLeft: () =>
        runEditorCommand((editor) => {
          editor.chain().focus().setTextAlign("left").run();
        }),
      alignCenter: () =>
        runEditorCommand((editor) => {
          editor.chain().focus().setTextAlign("center").run();
        }),
      alignRight: () =>
        runEditorCommand((editor) => {
          editor.chain().focus().setTextAlign("right").run();
        }),
      alignJustify: () =>
        runEditorCommand((editor) => {
          editor.chain().focus().setTextAlign("justify").run();
        }),
      insertImageOriginal: () => handleInsertSingleImage("original"),
      insertImageFixedWidth: () => handleInsertSingleImage("preset-width"),
      insertImageFixedHeight: () => handleInsertSingleImage("preset-height"),
      insertGallery2: () => handleInsertGalleryStrip(2),
      insertGallery3: () => handleInsertGalleryStrip(3),
      insertGallery4: () => handleInsertGalleryStrip(4),
      insertMosaic3: () => handleInsertMasonryLayout("masonry-3"),
      insertMosaic4: () => handleInsertMasonryLayout("masonry-4"),
    }),
    [handleInsertGalleryStrip, handleInsertMasonryLayout, handleInsertSingleImage],
  );

  useEffect(() => {
    onReady?.(editorActions);

    return () => {
      onReady?.(null);
    };
  }, [editorActions, onReady]);

  useEffect(() => {
    onHtmlChange?.(htmlValue);
  }, [htmlValue, onHtmlChange]);

  function startEdgeResize(params: {
    nodePos: number;
    startX: number;
    startWidth: number;
    edge: "left" | "right";
    keepSquare: boolean;
  }) {
    resizeStateRef.current = params;

    const handleMouseMove = (event: MouseEvent) => {
      const state = resizeStateRef.current;
      const editor = editorRef.current;
      if (!state || !editor) {
        return;
      }

      const delta = event.clientX - state.startX;
      const signedDelta = state.edge === "right" ? delta : -delta;
      const nextWidth = Math.max(80, Math.min(1800, Math.round(state.startWidth + signedDelta)));

      if (state.keepSquare) {
        editor
          .chain()
          .focus()
          .setNodeSelection(state.nodePos)
          .updateAttributes("image", { width: nextWidth, height: nextWidth })
          .run();
        return;
      }

      editor
        .chain()
        .focus()
        .setNodeSelection(state.nodePos)
        .updateAttributes("image", { width: nextWidth, height: null })
        .run();
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  const suggestionItems = useMemo(
    () =>
      createSuggestionItems([
        {
          title: "Texto",
          description: "Parrafo normal",
          searchTerms: ["texto", "parrafo", "p"],
          icon: <PilcrowIcon className="h-3.5 w-3.5" />,
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setParagraph().run();
          },
        },
        {
          title: "Titulo grande",
          description: "Heading 1",
          searchTerms: ["h1", "titulo"],
          icon: <Heading1Icon className="h-3.5 w-3.5" />,
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
          },
        },
        {
          title: "Subtitulo",
          description: "Heading 2",
          searchTerms: ["h2", "subtitulo"],
          icon: <Heading2Icon className="h-3.5 w-3.5" />,
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
          },
        },
        {
          title: "Subtitulo chico",
          description: "Heading 3",
          searchTerms: ["h3", "small heading"],
          icon: <Heading3Icon className="h-3.5 w-3.5" />,
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
          },
        },
        {
          title: "Lista",
          description: "Lista con bullets",
          searchTerms: ["ul", "bullet", "lista"],
          icon: <ListIcon className="h-3.5 w-3.5" />,
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
          },
        },
        {
          title: "Lista numerada",
          description: "Lista ordenada",
          searchTerms: ["ol", "numero"],
          icon: <ListOrderedIcon className="h-3.5 w-3.5" />,
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
          },
        },
        {
          title: "Cita",
          description: "Bloque de cita",
          searchTerms: ["quote", "cita"],
          icon: <QuoteIcon className="h-3.5 w-3.5" />,
          command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBlockquote().run();
          },
        },
      ] as SuggestionItem[]),
    [],
  );

  const extensions = useMemo(
    () => [
      StarterKit,
      MasonryGalleryNode,
      BlogImage.configure({
        inline: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Escribe tu historia... usa / para insertar bloques",
      }),
      Command.configure({
        suggestion: {
          items: ({ query }: { query: string }) => {
            const q = query.toLowerCase();
            return suggestionItems.filter((item) => {
              if (item.title.toLowerCase().includes(q)) {
                return true;
              }
              return item.searchTerms?.some((term) => term.toLowerCase().includes(q));
            });
          },
          render: () => renderItems(),
        },
      }),
    ],
    [suggestionItems],
  );

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <input type="hidden" name={jsonInputName} value={jsonValue} />
      <input type="hidden" name={htmlInputName} value={htmlValue} />

      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file || !editorRef.current) {
            return;
          }

          if (file.size > 10 * 1024 * 1024) {
            setUploadNotice("La imagen supera el limite de 10MB.");
            event.target.value = "";
            return;
          }

          setUploadNotice("");
          setUploadingImage(true);
          try {
            const url = await uploadImage(file);

            if (pendingMasonrySlot) {
              const currentNode = editorRef.current.state.doc.nodeAt(
                pendingMasonrySlot.nodePos,
              );
              if (currentNode?.type.name === "masonryGallery") {
                const currentItems = Array.isArray(currentNode.attrs.items)
                  ? (currentNode.attrs.items as MasonryItem[])
                  : [];
                const nextItems = currentItems.map((item) =>
                  item.slot === pendingMasonrySlot.slot
                    ? { ...item, src: url, alt: item.alt ?? `Imagen ${item.slot}` }
                    : item,
                );

                editorRef.current
                  .chain()
                  .focus()
                  .setNodeSelection(pendingMasonrySlot.nodePos)
                  .updateAttributes("masonryGallery", { items: nextItems })
                  .run();
              }
              setPendingMasonrySlot(null);
              return;
            }

            if (pendingPlaceholderNode) {
              const size = getGallerySquareSize(pendingPlaceholderNode.cols);

              editorRef.current
                .chain()
                .focus()
                .setNodeSelection(pendingPlaceholderNode.nodePos)
                .updateAttributes("image", {
                  src: url,
                  isPlaceholder: false,
                  width: pendingPlaceholderNode.width ?? size,
                  height: pendingPlaceholderNode.height ?? size,
                  imgAlign: "center",
                })
                .run();

              setPendingPlaceholderNode(null);
            } else {
              const attrs: {
                src: string;
                width?: number | null;
                height?: number | null;
                imgAlign?: string;
              } = { src: url };

              if (singleImageMode === "preset-width") {
                attrs.width = PRESET_WIDTH;
                attrs.height = null;
              } else if (singleImageMode === "preset-height") {
                attrs.width = null;
                attrs.height = PRESET_HEIGHT;
              } else {
                attrs.width = null;
                attrs.height = null;
              }

              attrs.imgAlign = "center";
              editorRef.current.chain().focus().setImage(attrs).run();
            }
          } catch (error) {
            setUploadNotice(
              error instanceof Error && error.message
                ? error.message
                : "No pudimos subir la imagen.",
            );
          } finally {
            setUploadingImage(false);
          }

          event.target.value = "";
        }}
      />

      <EditorRoot>
        <EditorContent
          initialContent={DEFAULT_CONTENT}
          extensions={extensions}
          editorProps={{
            handleDOMEvents: {
              keydown: (_, event) => handleCommandNavigation(event),
              mousedown: (view, event) => {
                const target = event.target as HTMLElement | null;
                const image = target?.closest("img");
                if (!image) {
                  return false;
                }

                const rect = image.getBoundingClientRect();
                const threshold = 12;
                const nearLeft = Math.abs(event.clientX - rect.left) <= threshold;
                const nearRight = Math.abs(event.clientX - rect.right) <= threshold;

                if (!nearLeft && !nearRight) {
                  return false;
                }

                const nodePos = view.posAtDOM(image, 0);
                const startWidth =
                  Number.parseInt(image.getAttribute("width") ?? "", 10) ||
                  Math.round(rect.width);

                const galleryCols = image.getAttribute("data-gallery-cols");
                const keepSquare = Boolean(galleryCols);

                startEdgeResize({
                  nodePos,
                  startX: event.clientX,
                  startWidth,
                  edge: nearRight ? "right" : "left",
                  keepSquare,
                });

                event.preventDefault();
                return true;
              },
            },
            handleClickOn: (_view, _pos, node, nodePos) => {
              if (node.type.name !== "image") {
                return false;
              }

              const attrs = node.attrs as {
                isPlaceholder?: boolean;
                galleryCols?: number;
                width?: number | string | null;
                height?: number | string | null;
              };

              if (!attrs.isPlaceholder) {
                return false;
              }

              const cols = Number.parseInt(String(attrs.galleryCols ?? "2"), 10);
              setPendingPlaceholderNode({
                nodePos,
                cols: Number.isFinite(cols) ? cols : 2,
                width:
                  typeof attrs.width === "number"
                    ? attrs.width
                    : Number.parseInt(String(attrs.width ?? ""), 10) || undefined,
                height:
                  typeof attrs.height === "number"
                    ? attrs.height
                    : Number.parseInt(String(attrs.height ?? ""), 10) || undefined,
              });
              imageFileInputRef.current?.click();
              return true;
            },
            handleClick: (view, _pos, event) => {
              const target = event.target as HTMLElement | null;
              const masonryImage = target?.closest(
                '[data-type="masonry-gallery"] img[data-slot]',
              ) as HTMLImageElement | null;
              if (masonryImage) {
                const slotRaw = masonryImage.getAttribute("data-slot") ?? "1";
                const slot = Number.parseInt(slotRaw, 10);
                const container = masonryImage.closest(
                  '[data-type="masonry-gallery"]',
                ) as HTMLElement | null;

                if (!container) {
                  return false;
                }

                const nodePos = view.posAtDOM(container, 0);
                setPendingPlaceholderNode(null);
                setPendingMasonrySlot({
                  nodePos,
                  slot: Number.isFinite(slot) ? slot : 1,
                });
                imageFileInputRef.current?.click();
                return true;
              }

              const image = target?.closest("img[data-placeholder='true']");
              if (!image) {
                return false;
              }

              const nodePos = view.posAtDOM(image, 0);
              const colsRaw = image.getAttribute("data-gallery-cols") ?? "2";
              const cols = Number.parseInt(colsRaw, 10);

              setPendingPlaceholderNode({
                nodePos,
                cols: Number.isFinite(cols) ? cols : 2,
                width: Number.parseInt(image.getAttribute("width") ?? "", 10) || undefined,
                height: Number.parseInt(image.getAttribute("height") ?? "", 10) || undefined,
              });

              imageFileInputRef.current?.click();
              return true;
            },
            attributes: {
              class:
                "blog-editor-content min-h-[340px] w-full max-w-none px-6 py-5 outline-none prose prose-neutral [&_.ProseMirror-selectednode]:ring-2 [&_.ProseMirror-selectednode]:ring-primary [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:leading-tight [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h3]:text-2xl [&_h3]:font-semibold [&_p]:text-[1.05rem] [&_p]:leading-8",
            },
          }}
          className="w-full"
          onCreate={({ editor }) => {
            editorRef.current = editor;
            setJsonValue(JSON.stringify(editor.getJSON()));
            setHtmlValue(editor.getHTML());
          }}
          onUpdate={({ editor }) => {
            editorRef.current = editor;
            setJsonValue(JSON.stringify(editor.getJSON()));
            setHtmlValue(editor.getHTML());
          }}
        >
          <ImageResizer />

          {!controlsInPanel ? <InlineTextAlignToolbar /> : null}

          <EditorBubble
            tippyOptions={{ placement: "top" }}
            className="rounded-lg border bg-background p-1 shadow-sm"
          >
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().toggleBold().run()}
              className="inline-flex cursor-pointer rounded px-2 py-1 text-xs hover:bg-muted"
            >
              B
            </EditorBubbleItem>
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().toggleItalic().run()}
              className="inline-flex cursor-pointer rounded px-2 py-1 text-xs hover:bg-muted"
            >
              I
            </EditorBubbleItem>
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className="inline-flex cursor-pointer rounded px-2 py-1 text-xs hover:bg-muted"
            >
              H2
            </EditorBubbleItem>
            <EditorBubbleItem
              onSelect={(editor) => editor.chain().focus().toggleBlockquote().run()}
              className="inline-flex cursor-pointer rounded px-2 py-1 text-xs hover:bg-muted"
            >
              Cita
            </EditorBubbleItem>
          </EditorBubble>

          <EditorCommand className="z-50 h-auto max-h-80 w-72 overflow-y-auto rounded-lg border bg-background p-2 shadow-md">
            <EditorCommandEmpty className="px-2 py-1.5 text-sm text-muted-foreground">
              Sin resultados
            </EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  key={item.title}
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="mb-1 cursor-pointer rounded-md px-2 py-1.5 aria-selected:bg-muted"
                >
                  <CommandLabel
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                  />
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>
        </EditorContent>
      </EditorRoot>

      {!controlsInPanel ? (
        <div className="border-t bg-muted/10 px-3 py-2">
          <p className="mb-2 text-xs text-muted-foreground">Imagenes</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleInsertSingleImage("original")}
              className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2.5 text-xs font-medium hover:bg-muted"
            >
              <ImagesIcon className="h-3.5 w-3.5" />
              Imagen original
            </button>
            <button
              type="button"
              onClick={() => handleInsertSingleImage("preset-width")}
              className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2.5 text-xs font-medium hover:bg-muted"
            >
              <ImagesIcon className="h-3.5 w-3.5" />
              Imagen ancho fijo
            </button>
            <button
              type="button"
              onClick={() => handleInsertSingleImage("preset-height")}
              className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2.5 text-xs font-medium hover:bg-muted"
            >
              <ImagesIcon className="h-3.5 w-3.5" />
              Imagen alto fijo
            </button>
            <button
              type="button"
              onClick={() => handleInsertGalleryStrip(2)}
              className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2.5 text-xs font-medium hover:bg-muted"
            >
              <ImagesIcon className="h-3.5 w-3.5" />
              Tira 2 imagenes
            </button>
            <button
              type="button"
              onClick={() => handleInsertGalleryStrip(3)}
              className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2.5 text-xs font-medium hover:bg-muted"
            >
              <ImagesIcon className="h-3.5 w-3.5" />
              Tira 3 imagenes
            </button>
            <button
              type="button"
              onClick={() => handleInsertGalleryStrip(4)}
              className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2.5 text-xs font-medium hover:bg-muted"
            >
              <ImagesIcon className="h-3.5 w-3.5" />
              Tira 4 imagenes
            </button>
          </div>
        </div>
      ) : null}

      <SelectedImagePanel />

      <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <span>Tip: presiona / para abrir comandos</span>
        {uploadingImage ? <span>Subiendo imagen...</span> : null}
        {!uploadingImage && uploadNotice ? <span>{uploadNotice}</span> : null}
      </div>
    </div>
  );
}
