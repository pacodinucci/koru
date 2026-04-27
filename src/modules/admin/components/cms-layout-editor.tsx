"use client";

import { createPortal } from "react-dom";
import { useState, useTransition } from "react";
import { ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAdminEditorPanel } from "@/modules/admin/components/admin-editor-panel";
import { publishCmsAction } from "@/modules/cms/server/cms-text.actions";
import {
  ensureLandingDefaults,
  LANDING_LAYOUT_FOOTER_BG_KEY,
  LANDING_LAYOUT_FOOTER_HEIGHT_KEY,
  LANDING_LAYOUT_FOOTER_TEXT_KEY,
  LANDING_LAYOUT_NAV_BG_KEY,
  LANDING_LAYOUT_NAV_HEIGHT_KEY,
  LANDING_LAYOUT_NAV_TEXT_KEY,
  LANDING_LAYOUT_PADDING_X_KEY,
} from "@/modules/landing/config/landing-sections";
import { LandingView } from "@/modules/landing/views/landing-view";

type LandingTextMap = Record<string, string>;

type CmsLayoutEditorProps = {
  initialTextMap: LandingTextMap;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseNumber(raw: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clamp(parsed, min, max);
}

export function CmsLayoutEditor({ initialTextMap }: CmsLayoutEditorProps) {
  const [textMap, setTextMap] = useState<LandingTextMap>(() =>
    ensureLandingDefaults(initialTextMap),
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [isPublishing, startPublishing] = useTransition();
  const { setOpen: setPanelOpen, portalTarget } = useAdminEditorPanel();

  const paddingX = parseNumber(textMap[LANDING_LAYOUT_PADDING_X_KEY], 24, 0, 160);
  const navHeight = parseNumber(textMap[LANDING_LAYOUT_NAV_HEIGHT_KEY], 96, 64, 180);
  const footerHeight = parseNumber(
    textMap[LANDING_LAYOUT_FOOTER_HEIGHT_KEY],
    220,
    120,
    600,
  );

  function updateLayoutField(fieldId: string, value: string) {
    setTextMap((previous) => ({
      ...previous,
      [fieldId]: value,
    }));
  }

  function handlePublish() {
    startPublishing(async () => {
      setStatusMessage("Publicando layout...");
      const result = await publishCmsAction(textMap);
      setStatusMessage(result.ok ? "Layout publicado." : result.message);
    });
  }

  const panelPortal = portalTarget
    ? createPortal(
        <div className="font-fira relative h-full overflow-visible">
          <button
            type="button"
            className="panel-close-float absolute top-1/2 -left-10 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/65 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
            onClick={() => setPanelOpen(false)}
            aria-label="Cerrar panel"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>

          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b">
              <div className="flex h-14 items-center justify-between px-4">
                <p className="text-sm font-medium">Layout</p>
                <Button type="button" size="sm" onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing ? "Publicando..." : "Publicar"}
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="space-y-3">
                <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">
                  Padding X global (px)
                  <Input
                    type="number"
                    min={0}
                    max={160}
                    value={paddingX}
                    onChange={(event) =>
                      updateLayoutField(LANDING_LAYOUT_PADDING_X_KEY, event.target.value)
                    }
                  />
                </label>

                <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">
                  Navbar fondo
                  <Input
                    value={textMap[LANDING_LAYOUT_NAV_BG_KEY] ?? "#ffffff"}
                    onChange={(event) =>
                      updateLayoutField(LANDING_LAYOUT_NAV_BG_KEY, event.target.value)
                    }
                  />
                </label>

                <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">
                  Navbar texto
                  <Input
                    value={textMap[LANDING_LAYOUT_NAV_TEXT_KEY] ?? "#111111"}
                    onChange={(event) =>
                      updateLayoutField(LANDING_LAYOUT_NAV_TEXT_KEY, event.target.value)
                    }
                  />
                </label>

                <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">
                  Navbar altura (px)
                  <Input
                    type="number"
                    min={64}
                    max={180}
                    value={navHeight}
                    onChange={(event) =>
                      updateLayoutField(LANDING_LAYOUT_NAV_HEIGHT_KEY, event.target.value)
                    }
                  />
                </label>

                <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">
                  Footer fondo
                  <Input
                    value={textMap[LANDING_LAYOUT_FOOTER_BG_KEY] ?? "#d8cfb6"}
                    onChange={(event) =>
                      updateLayoutField(LANDING_LAYOUT_FOOTER_BG_KEY, event.target.value)
                    }
                  />
                </label>

                <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">
                  Footer texto
                  <Input
                    value={textMap[LANDING_LAYOUT_FOOTER_TEXT_KEY] ?? "Koru OSA"}
                    onChange={(event) =>
                      updateLayoutField(LANDING_LAYOUT_FOOTER_TEXT_KEY, event.target.value)
                    }
                  />
                </label>

                <label className="block space-y-1.5 text-xs font-medium text-muted-foreground">
                  Footer altura (px)
                  <Input
                    type="number"
                    min={120}
                    max={600}
                    value={footerHeight}
                    onChange={(event) =>
                      updateLayoutField(LANDING_LAYOUT_FOOTER_HEIGHT_KEY, event.target.value)
                    }
                  />
                </label>

                {statusMessage ? (
                  <p className="text-xs text-muted-foreground">{statusMessage}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>,
        portalTarget,
      )
    : null;

  return (
    <Card className="font-fira h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-5 py-4">
        <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-900">
          <span>Layout builder (edicion global)</span>
        </CardTitle>
      </CardHeader>

      <CardContent className={cn("min-w-0 p-3 md:p-4")}>
        <div className="relative h-[74vh] w-full overflow-auto rounded-xl border bg-muted/20">
          <div className="flex w-full justify-center p-4">
            <div className="w-full max-w-[1200px]">
              <LandingView textMap={textMap} previewMode />
            </div>
          </div>
        </div>
      </CardContent>
      {panelPortal}
    </Card>
  );
}
