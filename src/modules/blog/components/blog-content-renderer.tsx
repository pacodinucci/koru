import Image from "next/image";

import type { BlogContentBlock } from "@/modules/blog/types/blog-content";

type BlogContentRendererProps = {
  blocks: BlogContentBlock[];
};

export function BlogContentRenderer({ blocks }: BlogContentRendererProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        if (block.type === "text") {
          if (block.style === "heading") {
            return (
              <h2 key={block.id} className="text-2xl font-semibold leading-tight text-foreground">
                {block.text}
              </h2>
            );
          }

          return (
            <p key={block.id} className="whitespace-pre-line text-[1.02rem] leading-8 text-foreground/90">
              {block.text}
            </p>
          );
        }

        if (block.type === "image") {
          if (block.layout === "left" || block.layout === "right") {
            return (
              <div
                key={block.id}
                className="grid items-start gap-4 rounded-xl bg-muted/20 p-3 md:grid-cols-2"
              >
                <div className={block.layout === "right" ? "md:order-2" : ""}>
                  <div className="overflow-hidden rounded-lg border bg-muted">
                    <Image
                      src={block.src}
                      alt={block.alt || "Imagen del post"}
                      width={1200}
                      height={900}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="h-full w-full object-cover"
                      unoptimized={block.src.startsWith("http")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {block.caption ? (
                    <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                      {block.caption}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Puedes combinar este bloque con parrafos antes o despues para construir la nota.
                    </p>
                  )}
                </div>
              </div>
            );
          }

          return (
            <figure key={block.id} className="space-y-2">
              <div className="overflow-hidden rounded-xl border bg-muted">
                <Image
                  src={block.src}
                  alt={block.alt || "Imagen del post"}
                  width={1400}
                  height={1000}
                  sizes="100vw"
                  className="h-full w-full object-cover"
                  unoptimized={block.src.startsWith("http")}
                />
              </div>
              {block.caption ? (
                <figcaption className="text-sm text-muted-foreground">{block.caption}</figcaption>
              ) : null}
            </figure>
          );
        }

        return (
          <figure key={block.id} className="space-y-2">
            <div className="grid gap-3 md:grid-cols-2">
              {block.images.map((image, index) => (
                <div key={`${block.id}-${index}`} className="overflow-hidden rounded-xl border bg-muted">
                  <Image
                    src={image.src}
                    alt={image.alt || `Imagen ${index + 1}`}
                    width={1000}
                    height={750}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="h-full w-full object-cover"
                    unoptimized={image.src.startsWith("http")}
                  />
                </div>
              ))}
            </div>
            {block.caption ? (
              <figcaption className="text-sm text-muted-foreground">{block.caption}</figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}
