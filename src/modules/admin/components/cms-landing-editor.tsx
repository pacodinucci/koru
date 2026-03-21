"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { cmsLandingSections } from "@/modules/admin/data/cms-landing-content";
import type { CmsSection } from "@/modules/admin/types/dashboard";
import {
  publishCmsAction,
  saveCmsDraftAction,
} from "@/modules/cms/server/cms-text.actions";

type LandingTextMap = Record<string, string>;

function buildInitialTextMap(sections: CmsSection[]): LandingTextMap {
  const map: LandingTextMap = {};
  for (const section of sections) {
    for (const field of section.fields) {
      map[field.id] = field.value;
    }
  }
  return map;
}

type CmsLandingEditorProps = {
  initialTextMap: LandingTextMap;
};

export function CmsLandingEditor({ initialTextMap }: CmsLandingEditorProps) {
  const [selectedSectionId, setSelectedSectionId] = useState(cmsLandingSections[0].id);
  const [textMap, setTextMap] = useState<LandingTextMap>({
    ...buildInitialTextMap(cmsLandingSections),
    ...initialTextMap,
  });
  const [statusMessage, setStatusMessage] = useState("");

  const selectedSection = useMemo(
    () =>
      cmsLandingSections.find((section) => section.id === selectedSectionId) ??
      cmsLandingSections[0],
    [selectedSectionId],
  );

  function updateField(fieldId: string, value: string) {
    setTextMap((previous) => ({
      ...previous,
      [fieldId]: value,
    }));
  }

  async function handleSaveDraft() {
    const result = await saveCmsDraftAction(textMap);
    setStatusMessage(result.ok ? "Draft guardado." : "No se pudo guardar.");
  }

  async function handlePublish() {
    const result = await publishCmsAction(textMap);
    setStatusMessage(
      result.ok ? "Cambios publicados en landing." : "No se pudo publicar.",
    );
  }

  return (
    <div className="grid flex-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between text-base">
            Landing preview (mini)
            <Badge variant="secondary">Text mode</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mx-auto w-full max-w-4xl rounded-xl border bg-muted/25 p-3">
            <div className="origin-top-left scale-[0.82] space-y-3 md:scale-[0.92] lg:scale-[1]">
              {cmsLandingSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSectionId(section.id)}
                  className={cn(
                    "w-full rounded-lg border bg-background p-4 text-left transition",
                    selectedSectionId === section.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "hover:border-foreground/40",
                  )}
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {section.title}
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-tight">
                    {textMap[section.fields[0].id]}
                  </p>
                  {section.fields[1] ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {textMap[section.fields[1].id]}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">
            Edit section: {selectedSection.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{selectedSection.note}</p>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {selectedSection.fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <label className="text-sm font-medium">{field.label}</label>
              {field.multiline ? (
                <Textarea
                  value={textMap[field.id] ?? ""}
                  onChange={(event) => updateField(field.id, event.target.value)}
                  rows={5}
                />
              ) : (
                <Input
                  value={textMap[field.id] ?? ""}
                  onChange={(event) => updateField(field.id, event.target.value)}
                />
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={handleSaveDraft}>
              Save draft
            </Button>
            <Button type="button" variant="outline" onClick={handlePublish}>
              Publish
            </Button>
          </div>
          {statusMessage ? (
            <p className="text-xs text-muted-foreground">{statusMessage}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
