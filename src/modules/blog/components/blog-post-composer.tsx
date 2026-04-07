"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ImagePlusIcon, MoveDownIcon, MoveUpIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createDefaultBlogBlocks,
  type BlogContentBlock,
} from "@/modules/blog/types/blog-content";

type BlogPostComposerProps = {
  inputName?: string;
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

type UploadingState = Record<string, boolean>;

export function BlogPostComposer({ inputName = "contentBlocks" }: BlogPostComposerProps) {
  const [blocks, setBlocks] = useState<BlogContentBlock[]>(createDefaultBlogBlocks);
  const [uploading, setUploading] = useState<UploadingState>({});

  const serializedBlocks = useMemo(() => JSON.stringify(blocks), [blocks]);

  function replaceBlock(id: string, updater: (block: BlogContentBlock) => BlogContentBlock) {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? updater(block) : block)),
    );
  }

  function addTextBlock(style: "paragraph" | "heading") {
    setBlocks((current) => [
      ...current,
      {
        id: createId("text"),
        type: "text",
        style,
        text: "",
      },
    ]);
  }

  function addImageBlock(layout: "full" | "left" | "right") {
    setBlocks((current) => [
      ...current,
      {
        id: createId("image"),
        type: "image",
        src: "",
        alt: "",
        caption: "",
        layout,
      },
    ]);
  }

  function addGalleryBlock() {
    setBlocks((current) => [
      ...current,
      {
        id: createId("gallery"),
        type: "gallery",
        caption: "",
        images: [
          { src: "", alt: "" },
          { src: "", alt: "" },
        ],
      },
    ]);
  }

  function removeBlock(id: string) {
    setBlocks((current) => {
      const next = current.filter((block) => block.id !== id);
      if (next.length === 0) {
        return createDefaultBlogBlocks();
      }
      return next;
    });
  }

  function moveBlock(id: string, direction: "up" | "down") {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === id);
      if (index < 0) {
        return current;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, item);
      return copy;
    });
  }

  async function uploadImage(file: File, onSuccess: (url: string) => void, key: string) {
    setUploading((current) => ({ ...current, [key]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/blog", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        ok?: boolean;
        url?: string;
      };

      if (response.ok && result.ok && result.url) {
        onSuccess(result.url);
      }
    } finally {
      setUploading((current) => ({ ...current, [key]: false }));
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <input type="hidden" name={inputName} value={serializedBlocks} />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => addTextBlock("heading")}>
          <PlusIcon />
          Titulo
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => addTextBlock("paragraph")}>
          <PlusIcon />
          Parrafo
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => addImageBlock("full")}>
          <ImagePlusIcon />
          Imagen ancha
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => addImageBlock("left")}>
          <ImagePlusIcon />
          Imagen izquierda
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => addImageBlock("right")}>
          <ImagePlusIcon />
          Imagen derecha
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={addGalleryBlock}>
          <ImagePlusIcon />
          Galeria 2
        </Button>
      </div>

      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div key={block.id} className="space-y-3 rounded-md border bg-background p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded border px-2 py-1">Bloque {index + 1}</span>
              <span className="rounded border px-2 py-1 uppercase">{block.type}</span>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => moveBlock(block.id, "up")}
                  disabled={index === 0}
                >
                  <MoveUpIcon />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => moveBlock(block.id, "down")}
                  disabled={index === blocks.length - 1}
                >
                  <MoveDownIcon />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => removeBlock(block.id)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>

            {block.type === "text" ? (
              <>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={block.style}
                  onChange={(event) => {
                    const value = event.target.value === "heading" ? "heading" : "paragraph";
                    replaceBlock(block.id, (current) => {
                      if (current.type !== "text") {
                        return current;
                      }

                      return {
                        ...current,
                        style: value,
                      };
                    });
                  }}
                >
                  <option value="heading">Titulo</option>
                  <option value="paragraph">Parrafo</option>
                </select>
                <Textarea
                  rows={block.style === "heading" ? 2 : 6}
                  value={block.text}
                  placeholder={block.style === "heading" ? "Titulo del bloque" : "Texto del bloque"}
                  onChange={(event) => {
                    const value = event.target.value;
                    replaceBlock(block.id, (current) => {
                      if (current.type !== "text") {
                        return current;
                      }
                      return { ...current, text: value };
                    });
                  }}
                />
              </>
            ) : null}

            {block.type === "image" ? (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={block.src}
                    placeholder="URL de imagen"
                    onChange={(event) => {
                      const value = event.target.value;
                      replaceBlock(block.id, (current) => {
                        if (current.type !== "image") {
                          return current;
                        }
                        return { ...current, src: value };
                      });
                    }}
                  />
                  <Input
                    value={block.alt}
                    placeholder="Texto alternativo"
                    onChange={(event) => {
                      const value = event.target.value;
                      replaceBlock(block.id, (current) => {
                        if (current.type !== "image") {
                          return current;
                        }
                        return { ...current, alt: value };
                      });
                    }}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }

                      await uploadImage(
                        file,
                        (url) => {
                          replaceBlock(block.id, (current) => {
                            if (current.type !== "image") {
                              return current;
                            }
                            return { ...current, src: url };
                          });
                        },
                        block.id,
                      );

                      event.target.value = "";
                    }}
                  />
                  <div className="text-xs text-muted-foreground">
                    {uploading[block.id] ? "Subiendo imagen..." : "Puedes subir un archivo o pegar una URL."}
                  </div>
                </div>

                <Textarea
                  rows={2}
                  value={block.caption ?? ""}
                  placeholder="Caption (opcional)"
                  onChange={(event) => {
                    const value = event.target.value;
                    replaceBlock(block.id, (current) => {
                      if (current.type !== "image") {
                        return current;
                      }
                      return { ...current, caption: value };
                    });
                  }}
                />

                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={block.layout}
                  onChange={(event) => {
                    const value =
                      event.target.value === "left" || event.target.value === "right"
                        ? event.target.value
                        : "full";
                    replaceBlock(block.id, (current) => {
                      if (current.type !== "image") {
                        return current;
                      }
                      return { ...current, layout: value };
                    });
                  }}
                >
                  <option value="full">Imagen ancha</option>
                  <option value="left">Imagen izquierda + texto</option>
                  <option value="right">Imagen derecha + texto</option>
                </select>

                {block.src ? (
                  <div className="relative h-52 overflow-hidden rounded-md border">
                    <Image src={block.src} alt={block.alt || "preview"} fill className="object-cover" unoptimized />
                  </div>
                ) : null}
              </div>
            ) : null}

            {block.type === "gallery" ? (
              <div className="space-y-3">
                {[0, 1].map((slot) => {
                  const image = block.images[slot];
                  const uploadKey = `${block.id}-${slot}`;
                  return (
                    <div key={uploadKey} className="space-y-2 rounded-md border p-2">
                      <p className="text-xs font-medium text-muted-foreground">Imagen {slot + 1}</p>
                      <Input
                        value={image.src}
                        placeholder="URL de imagen"
                        onChange={(event) => {
                          const value = event.target.value;
                          replaceBlock(block.id, (current) => {
                            if (current.type !== "gallery") {
                              return current;
                            }

                            const images = [...current.images];
                            images[slot] = { ...images[slot], src: value };
                            return { ...current, images };
                          });
                        }}
                      />
                      <Input
                        value={image.alt}
                        placeholder="Texto alternativo"
                        onChange={(event) => {
                          const value = event.target.value;
                          replaceBlock(block.id, (current) => {
                            if (current.type !== "gallery") {
                              return current;
                            }

                            const images = [...current.images];
                            images[slot] = { ...images[slot], alt: value };
                            return { ...current, images };
                          });
                        }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }

                          await uploadImage(
                            file,
                            (url) => {
                              replaceBlock(block.id, (current) => {
                                if (current.type !== "gallery") {
                                  return current;
                                }
                                const images = [...current.images];
                                images[slot] = { ...images[slot], src: url };
                                return { ...current, images };
                              });
                            },
                            uploadKey,
                          );

                          event.target.value = "";
                        }}
                      />
                      {uploading[uploadKey] ? (
                        <p className="text-xs text-muted-foreground">Subiendo imagen...</p>
                      ) : null}
                    </div>
                  );
                })}

                <Textarea
                  rows={2}
                  value={block.caption ?? ""}
                  placeholder="Caption de galeria (opcional)"
                  onChange={(event) => {
                    const value = event.target.value;
                    replaceBlock(block.id, (current) => {
                      if (current.type !== "gallery") {
                        return current;
                      }

                      return {
                        ...current,
                        caption: value,
                      };
                    });
                  }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
