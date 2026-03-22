"use client";

import { useMemo, useState } from "react";
import { GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  LANDING_STRUCTURE_KEY,
  ensureLandingDefaults,
  getSectionFieldKey,
  landingSectionCatalog,
  parseLandingStructure,
  type LandingSectionInstance,
  type LandingSectionType,
} from "@/modules/landing/config/landing-sections";
import { getLandingFieldSizeKey } from "@/modules/landing/types/landing-text";
import {
  publishCmsAction,
  saveCmsDraftAction,
} from "@/modules/cms/server/cms-text.actions";
import { LandingView } from "@/modules/landing/views/landing-view";

type LandingTextMap = Record<string, string>;

type CmsLandingEditorProps = {
  initialTextMap: LandingTextMap;
};

function createSectionId(type: LandingSectionType) {
  return `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getTypeDefaults(type: LandingSectionType) {
  return landingSectionCatalog[type];
}

export function CmsLandingEditor({ initialTextMap }: CmsLandingEditorProps) {
  const initialStructure = parseLandingStructure(initialTextMap);
  const [textMap, setTextMap] = useState<LandingTextMap>(() =>
    ensureLandingDefaults(initialTextMap),
  );
  const [structure, setStructure] = useState<LandingSectionInstance[]>(initialStructure);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [newSectionType, setNewSectionType] = useState<LandingSectionType>("hero");
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const selectedSection = useMemo(
    () => structure.find((section) => section.id === selectedSectionId) ?? null,
    [selectedSectionId, structure],
  );

  const selectedSectionDefinition = selectedSection
    ? getTypeDefaults(selectedSection.type)
    : null;

  function updateField(fieldId: string, value: string) {
    setTextMap((previous) => ({
      ...previous,
      [fieldId]: value,
    }));
  }

  function commitStructure(nextStructure: LandingSectionInstance[]) {
    setStructure(nextStructure);
    setTextMap((previous) => ({
      ...previous,
      [LANDING_STRUCTURE_KEY]: JSON.stringify(nextStructure),
    }));
  }

  function addSection() {
    const id = createSectionId(newSectionType);
    const def = getTypeDefaults(newSectionType);
    const newSection: LandingSectionInstance = {
      id,
      type: newSectionType,
      name: `${def.label} ${structure.filter((item) => item.type === newSectionType).length + 1}`,
    };
    const nextStructure = [...structure, newSection];

    setTextMap((previous) => {
      const next: LandingTextMap = {
        ...previous,
        [LANDING_STRUCTURE_KEY]: JSON.stringify(nextStructure),
      };

      for (const field of def.fields) {
        const key = getSectionFieldKey(id, field.key);
        next[key] = field.defaultValue;
        next[getLandingFieldSizeKey(key)] = String(field.defaultSize);
      }

      return next;
    });

    setStructure(nextStructure);
    setSelectedSectionId(id);
    setSelectedFieldId(getSectionFieldKey(id, def.fields[0].key));
  }

  function removeSection(sectionId: string) {
    if (structure.length <= 1) {
      return;
    }
    const nextStructure = structure.filter((section) => section.id !== sectionId);
    commitStructure(nextStructure);
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  }

  function reorderSections(sourceId: string, targetId: string) {
    if (sourceId === targetId) {
      return;
    }

    const sourceIndex = structure.findIndex((section) => section.id === sourceId);
    const targetIndex = structure.findIndex((section) => section.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const next = [...structure];
    const [item] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, item);
    commitStructure(next);
  }

  function handleSelectField(fieldId: string) {
    const match = fieldId.match(/^section\.([^.]*)\./);
    if (match?.[1]) {
      setSelectedSectionId(match[1]);
    }
    setSelectedFieldId(fieldId);
  }

  async function handleSaveDraft() {
    const payload = {
      ...textMap,
      [LANDING_STRUCTURE_KEY]: JSON.stringify(structure),
    };
    const result = await saveCmsDraftAction(payload);
    setStatusMessage(result.ok ? "Draft guardado." : "No se pudo guardar.");
  }

  async function handlePublish() {
    const payload = {
      ...textMap,
      [LANDING_STRUCTURE_KEY]: JSON.stringify(structure),
    };
    const result = await publishCmsAction(payload);
    setStatusMessage(
      result.ok ? "Cambios publicados en landing." : "No se pudo publicar.",
    );
  }

  return (
    <div className="grid flex-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between text-base">
            Landing preview (live mini)
            <Badge variant="secondary">Builder mode</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-[74vh] overflow-auto rounded-xl border bg-muted/20 p-3">
            <div className="min-w-[1550px] origin-top-left" style={{ zoom: 0.58 }}>
              <div
                onClickCapture={(event) => {
                  const target = event.target as HTMLElement;
                  if (
                    target.closest("a") ||
                    target.closest("button") ||
                    target.closest("form")
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <LandingView
                  textMap={{
                    ...textMap,
                    [LANDING_STRUCTURE_KEY]: JSON.stringify(structure),
                  }}
                  previewMode
                  selectedFieldId={selectedFieldId}
                  onSelectField={handleSelectField}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">
            {selectedSection
              ? `Edit section: ${landingSectionCatalog[selectedSection.type].label}`
              : "Landing structure"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={newSectionType}
              onChange={(event) => setNewSectionType(event.target.value as LandingSectionType)}
            >
              {Object.values(landingSectionCatalog).map((item) => (
                <option key={item.type} value={item.type}>
                  {item.label}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" onClick={addSection}>
              Add section
            </Button>
            {selectedSection ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedSectionId(null)}
              >
                Back to order
              </Button>
            ) : null}
          </div>

          {selectedSection && selectedSectionDefinition ? (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Section name</label>
                <Input
                  value={selectedSection.name}
                  onChange={(event) =>
                    commitStructure(
                      structure.map((item) =>
                        item.id === selectedSection.id
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </div>

              {selectedSectionDefinition.fields.map((field) => {
                const key = getSectionFieldKey(selectedSection.id, field.key);
                const sizeKey = getLandingFieldSizeKey(key);

                return (
                  <div
                    key={key}
                    className={cn(
                      "space-y-3 rounded-lg border bg-muted/20 p-3",
                      selectedFieldId === key && "border-primary bg-primary/5",
                    )}
                  >
                    <p className="text-sm font-semibold">{field.label}</p>
                    <div className="grid gap-3 md:grid-cols-[1fr_150px] md:items-start">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Texto
                        </label>
                        {field.multiline ? (
                          <Textarea
                            value={textMap[key] ?? ""}
                            onChange={(event) => updateField(key, event.target.value)}
                            onFocus={() => setSelectedFieldId(key)}
                            rows={4}
                          />
                        ) : (
                          <Input
                            value={textMap[key] ?? ""}
                            onChange={(event) => updateField(key, event.target.value)}
                            onFocus={() => setSelectedFieldId(key)}
                          />
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Tamano (px)
                        </label>
                        <Input
                          type="number"
                          min={10}
                          max={96}
                          step={1}
                          value={textMap[sizeKey] ?? String(field.defaultSize)}
                          onChange={(event) => updateField(sizeKey, event.target.value)}
                          onFocus={() => setSelectedFieldId(key)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="space-y-2 rounded-lg border p-2">
              <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Orden de secciones (drag and drop)
              </p>
              {structure.map((section) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => setDraggedSectionId(section.id)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverSectionId(section.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedSectionId) {
                      reorderSections(draggedSectionId, section.id);
                    }
                    setDraggedSectionId(null);
                    setDragOverSectionId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedSectionId(null);
                    setDragOverSectionId(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-md border bg-background px-2 py-2 text-sm",
                    dragOverSectionId === section.id && "border-primary bg-primary/5",
                  )}
                >
                  <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{section.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {landingSectionCatalog[section.type].label}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSectionId(section.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSection(section.id)}
                    disabled={structure.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

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
