"use client";

import type { ReactNode, RefObject } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CmsPreviewFrameProps = {
  title: string;
  actions?: ReactNode;
  frameVariant?: "default" | "flush";
  compactSpacing?: boolean;
  scrollRef?: RefObject<HTMLDivElement | null>;
  contentClassName?: string;
  viewportScroll?: "auto" | "hidden";
  viewportHeightClassName?: string;
  children: ReactNode;
};

export function CmsPreviewFrame({
  title,
  actions,
  frameVariant = "default",
  compactSpacing = false,
  scrollRef,
  contentClassName,
  viewportScroll = "auto",
  viewportHeightClassName,
  children,
}: CmsPreviewFrameProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden",
        frameVariant === "flush" &&
          "flex h-full min-h-0 flex-col rounded-none border-0 shadow-none",
      )}
    >
      <CardHeader
        className={cn(
          "border-b",
          frameVariant === "flush" && "rounded-none px-0",
        )}
      >
        <CardTitle className="flex flex-wrap items-center justify-between gap-3 px-4 text-base">
          <span>{title}</span>
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </CardTitle>
      </CardHeader>

      <CardContent
        className={cn(
          "min-w-0 p-3 md:p-4",
          frameVariant === "flush" && "flex-1 min-h-0 p-0",
          compactSpacing && "p-1 md:p-1.5",
          contentClassName,
        )}
      >
        <div
          ref={scrollRef}
          className={cn(
            "relative h-[74vh] w-full rounded-xl border bg-muted/20",
            viewportHeightClassName,
            viewportScroll === "auto" ? "overflow-auto" : "overflow-hidden",
            frameVariant === "flush" && "rounded-none border-0",
            compactSpacing && !viewportHeightClassName && "h-[72vh]",
          )}
        >
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
