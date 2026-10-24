"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent,
  ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { PsychopedagogyFollowupTable } from "./psychopedagogy-followup-table";
import { PsychopedagogyInterventionTable } from "./psychopedagogy-intervention-table";
import { PsychopedagogyInstrumentTable } from "./psychopedagogy-instrument-table";
import type {
  InstrumentKind, PsychopedagogyProfileDTO, PsychopedagogyProfilePayload,
  PsychopedagogyProfileSection as SectionKey, StudentOption,
} from "../lib/profile-contract";
import { ProfileFields, ProfileRecords, learningReportPanelClassName, type EditorKind } from "./psychopedagogy-profile-fields";
import { readLearningReportAction, saveLearningReportAction } from "@/modules/psychopedagogy/server/learning-report.actions";

export const profileSectionLabels: Record<SectionKey, string> = {
  learning: "Estilo de aprendizaje y temperamento",
  followups: "Seguimientos realizados",
  interventions: "Intervenciones realizadas",
  instruments: "Instrumentos psicopedagógicos aplicados",
};
const sections: SectionKey[] = ["learning", "followups", "interventions", "instruments"];
const actions: Record<SectionKey, { kind: EditorKind; label: string }[]> = {
  learning: [{ kind: "learning", label: "Editar descripción" }],
  followups: [{ kind: "observation", label: "Agregar observación" }, { kind: "accompaniment", label: "Nuevo acompañamiento" }],
  interventions: [{ kind: "intervention", label: "Nueva intervención" }],
  instruments: [{ kind: "instrument", label: "Registrar instrumento" }],
};
const saveLabels: Record<EditorKind, string> = {
  learning: "Guardar descripción", observation: "Guardar reporte", accompaniment: "Guardar acompañamiento",
  intervention: "Guardar intervención", instrument: "Guardar instrumento",
};
type ProfileProps = { student: StudentOption; readOnly: boolean; canEditLearning?: boolean; canEditFollowups?: boolean; canEditInterventions?: boolean; canEditInstruments?: boolean };
export type LearningEditorState = { editing: boolean; saving: boolean };
export type FollowupActions = { label: string; create: () => void };
type SectionProps = ProfileProps & {
  section: SectionKey;
  followupsTabs?: boolean;
  learningFormId?: string;
  onLearningStateChange?: (state: LearningEditorState) => void;
  onFollowupActionsChange?: (actions: FollowupActions | null) => void;
  onInterventionActionsChange?: (actions: FollowupActions | null) => void;
  onInstrumentActionsChange?: (actions: FollowupActions | null) => void;
};

async function readProfileResponse(response: Response) {
  const message = response.status === 404
    ? "La API del perfil psicopedagógico no está disponible. Actualizá la página y volvé a intentar."
    : "El servidor devolvió una respuesta inesperada. Intentá nuevamente.";
  if (!response.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    throw new Error(message);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(message);
  }
}

export function PsychopedagogyProfile({ student, readOnly, canEditLearning = false, initialSection }: ProfileProps & { initialSection?: SectionKey }) {
  const [expanded, setExpanded] = useState<SectionKey[]>(initialSection ? [initialSection] : []);
  return <section className="min-w-0 space-y-3" aria-label="Perfil psicopedagógico">
    <Accordion value={expanded} onValueChange={(values) => setExpanded(values.filter((value): value is SectionKey => sections.includes(value as SectionKey)))}>
      {sections.map((section, index) => <AccordionItem key={section} value={section}>
        <AccordionTrigger>{index + 1}. {profileSectionLabels[section]}</AccordionTrigger>
        <AccordionContent>
          {expanded.includes(section) ? <PsychopedagogyProfileSection student={student} readOnly={readOnly} canEditLearning={canEditLearning} section={section} /> : null}
        </AccordionContent>
      </AccordionItem>)}
    </Accordion>
  </section>;
}

// Keying the lifecycle prevents any old student's data or unsaved fields appearing on a prop switch.
export function PsychopedagogyProfileSection(props: SectionProps) {
  const readOnly = props.readOnly && !((props.canEditLearning && props.section === "learning") || (props.canEditFollowups && props.section === "followups") || (props.canEditInterventions && props.section === "interventions") || (props.canEditInstruments && props.section === "instruments"));
  return <SectionEditor key={`${props.student.id}:${props.section}:${readOnly}`} {...props} readOnly={readOnly} />;
}

function writePayload(kind: EditorKind, data: FormData): PsychopedagogyProfilePayload | { date: string; title: string; body: string } {
  const text = (name: string) => String(data.get(name) ?? "");
  if (kind === "learning") return { section: "learning", description: text("description") };
  const date = text("date");
  if (kind === "instrument") return { section: "instrument", date, kind: text("kind") as InstrumentKind, name: text("name"), body: text("body") };
  const title = text("title");
  if (kind === "intervention") return {
    section: "intervention", date, title, observationAnalysis: text("observationAnalysis"),
    strategyFeedback: text("strategyFeedback"), workPlan: text("workPlan"),
    implementation: text("implementation"), evaluationResults: text("evaluationResults"),
  };
  const body = text("body");
  if (kind === "accompaniment") return { section: "accompaniment", date, kind: data.get("kind") === "FAMILY" ? "FAMILY" : "INDIVIDUAL", title, body };
  return { date, title, body };
}

function SectionEditor({ student, readOnly, section, followupsTabs = false, learningFormId, onLearningStateChange, onFollowupActionsChange, onInterventionActionsChange, onInstrumentActionsChange }: SectionProps) {
  const { toast } = useToast();
  const [followupTab, setFollowupTab] = useState<"observations" | "accompaniments">("observations");
  const [profile, setProfile] = useState<PsychopedagogyProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [editor, setEditor] = useState<EditorKind | null>(null);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const saveRequest = useRef<AbortController | null>(null);
  const baseUrl = `/api/teacher/students/${encodeURIComponent(student.id)}/psychopedagogy`;
  const profileUrl = `${baseUrl}/profile`;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    async function load() {
      try {
        if (section === "learning") {
          const result = await readLearningReportAction(student.id);
          if (!result.ok) throw new Error(result.error);
          if (!controller.signal.aborted) setProfile({
            learningStyleAndTemperament: result.description,
            observations: [], accompaniments: [], interventions: [], instruments: [],
          });
        } else {
          const response = await fetch(profileUrl, { cache: "no-store", signal: controller.signal });
          const result = await readProfileResponse(response);
          if (!response.ok) throw new Error(result.error ?? "No pudimos cargar el perfil psicopedagógico.");
          if (!controller.signal.aborted) setProfile(result.profile);
        }
      } catch (cause) {
        if (!controller.signal.aborted) setLoadError(cause instanceof Error ? cause.message : "No pudimos cargar el perfil psicopedagógico.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [profileUrl, revision, section, student.id]);

  useEffect(() => () => { saveRequest.current?.abort(); }, []);

  useEffect(() => {
    if (section === "learning") onLearningStateChange?.({ editing: editor === "learning", saving });
  }, [section, editor, saving, onLearningStateChange]);

  useEffect(() => {
    if (section !== "followups" || !followupsTabs || !onFollowupActionsChange) return;
    onFollowupActionsChange(readOnly || loading || loadError || !profile ? null : {
      label: followupTab === "observations" ? "Nueva bitácora" : "Nuevo acompañamiento",
      create: () => {
        setSaveError(null);
        setSaved(false);
        setEditor(followupTab === "observations" ? "observation" : "accompaniment");
      },
    });
  }, [section, followupsTabs, onFollowupActionsChange, readOnly, loading, loadError, profile, followupTab]);

  useEffect(() => {
    if (section !== "interventions" || !onInterventionActionsChange) return;
    onInterventionActionsChange(readOnly || loading || loadError || !profile ? null : {
      label: "Nueva intervención",
      create: () => {
        setSaveError(null);
        setSaved(false);
        setEditor("intervention");
      },
    });
  }, [section, onInterventionActionsChange, readOnly, loading, loadError, profile]);

  useEffect(() => {
    if (section !== "instruments" || !onInstrumentActionsChange) return;
    onInstrumentActionsChange(readOnly || loading || loadError || !profile ? null : {
      label: "Registrar instrumento",
      create: () => {
        setSaveError(null);
        setSaved(false);
        setEditor("instrument");
      },
    });
  }, [section, onInstrumentActionsChange, readOnly, loading, loadError, profile]);

  function cancel() {
    saveRequest.current?.abort();
    saveRequest.current = null;
    setSaving(false);
    setSaveError(null);
    setEditor(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly || !editor || saveRequest.current) return;
    const controller = new AbortController();
    saveRequest.current = controller;
    const payload = writePayload(editor, new FormData(event.currentTarget));
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      if (editor === "learning" && "description" in payload) {
        const result = await saveLearningReportAction(student.id, payload.description);
        if (!result.ok) throw new Error(result.error);
      } else {
        const response = await fetch(editor === "observation" ? baseUrl : profileUrl, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload), signal: controller.signal,
        });
        const result = await readProfileResponse(response);
        if (!response.ok || !result.ok) throw new Error(result.error ?? "No pudimos guardar los cambios.");
      }
      if (!controller.signal.aborted) {
        if (editor === "observation" || editor === "accompaniment") {
          toast(editor === "observation" ? "Bitácora guardada correctamente." : "Acompañamiento guardado correctamente.", "success");
        }
        if (editor === "intervention") toast("Intervención guardada correctamente.", "success");
        if (editor === "instrument") toast("Instrumento guardado correctamente.", "success");
        setSaved(true);
        setEditor(null);
        setLoading(true);
        setRevision((value) => value + 1);
      }
    } catch (cause) {
      if (!controller.signal.aborted) setSaveError(cause instanceof Error ? cause.message : "No pudimos guardar los cambios.");
    } finally {
      if (!controller.signal.aborted) {
        saveRequest.current = null;
        setSaving(false);
      }
    }
  }

  const statusPadding = (section === "followups" && followupsTabs) || section === "interventions" || section === "instruments" ? "px-6 py-3 " : "";
  if (loading) return <p role="status" className={`${statusPadding}text-sm text-muted-foreground`}>Cargando perfil psicopedagógico…</p>;
  if (loadError) return <div role="alert" className={`${statusPadding}space-y-2 text-sm text-red-700`}>
    <p>{loadError}</p><Button type="button" variant="outline" onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Reintentar</Button>
  </div>;
  if (!profile) return null;

  function startEditing(kind: EditorKind) {
    setSaveError(null);
    setSaved(false);
    setEditor(kind);
  }

  if (section === "learning") return <div className="min-w-0">
    {saved ? <p role="status" className="sr-only">Reporte guardado correctamente.</p> : null}
    {!readOnly && editor === "learning" ? <form id={learningFormId} onSubmit={submit} className="space-y-3">
      {saveError ? <p role="alert" className="text-sm text-red-700">{saveError}</p> : null}
      <textarea name="description" aria-label="Estilo de aprendizaje y temperamento"
        defaultValue={profile.learningStyleAndTemperament} maxLength={10000} required disabled={saving}
        className={`${learningReportPanelClassName} block w-full resize-none text-sm leading-5 text-slate-700 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20`} />
      {!learningFormId ? <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={cancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar descripción"}</Button>
      </div> : null}
    </form> : <ProfileRecords section="learning" profile={profile}
      learningAction={!readOnly ? <Button type="button" variant="ghost" size="icon"
        className="size-10 rounded-full text-primary" aria-label="Editar descripción" title="Editar descripción"
        onClick={() => startEditing("learning")}><Pencil className="size-4" aria-hidden="true" /></Button> : null} />}
  </div>;

  const editForm = !readOnly && editor ? <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 p-4">
    <h3 className="font-semibold">{actions[section].find((action) => action.kind === editor)?.label}</h3>
    {saveError ? <p role="alert" className="text-sm text-red-700">{saveError}</p> : null}
    <ProfileFields kind={editor} prefix={`psychopedagogy-${student.id}-${section}`} description={profile.learningStyleAndTemperament} disabled={saving} />
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="outline" onClick={cancel}>Cancelar</Button>
      <Button type="submit" disabled={saving}>{saving ? "Guardando…" : saveLabels[editor]}</Button>
    </div>
  </form> : null;

  if (section === "followups" && followupsTabs) {
    function changeTab(value: unknown) {
      if (value !== "observations" && value !== "accompaniments") return;
      if (value !== followupTab) { cancel(); setFollowupTab(value); }
    }
    const creationTitle = followupTab === "observations" ? "Nueva bitácora" : "Nuevo acompañamiento";
    const creationFormId = `psychopedagogy-${student.id}-followup-create`;
    return <Tabs value={followupTab} onValueChange={changeTab}>
      <TabsList aria-label="Tipos de seguimiento" className="flex flex-nowrap gap-0 border-b border-slate-200 px-6">
        {(["observations", "accompaniments"] as const).map((tab) => <TabsTrigger key={tab} value={tab} onClick={() => changeTab(tab)}
          className="min-w-0 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2 text-xs text-muted-foreground sm:text-sm data-[active]:mb-0 data-[active]:border-primary data-[active]:bg-transparent data-[active]:text-primary">
          {tab === "observations" ? "Bitácoras de observación" : "Acompañamientos"}
        </TabsTrigger>)}
      </TabsList>
      <TabsContent value={followupTab} className="space-y-4 rounded-none border-0 bg-background p-0 md:p-0">
        <PsychopedagogyFollowupTable key={followupTab} profile={profile} tab={followupTab} />
        {!readOnly && !onFollowupActionsChange ? <div className="flex justify-end px-6">
          <Button type="button" onClick={() => startEditing(followupTab === "observations" ? "observation" : "accompaniment")}>
            {creationTitle}
          </Button>
        </div> : null}
      </TabsContent>
      <ResponsiveDialog open={!readOnly && Boolean(editor)} onOpenChange={(open) => { if (!open) cancel(); }}>
        <ResponsiveDialogContent className="[font-family:var(--font-montserrat)] md:w-[min(calc(100vw-2rem),44rem)]">
          <ResponsiveDialogHeader className="px-6 pt-6 pb-3">
            <ResponsiveDialogTitle className="[font-family:var(--font-montserrat)] text-lg text-primary">{creationTitle}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{student.firstName} {student.lastName} · {student.group.name}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="px-6 pt-3 pb-6">
            {!readOnly && editor ? <form id={creationFormId} onSubmit={submit} className="space-y-4">
              {saveError ? <p role="alert" className="text-sm text-red-700">{saveError}</p> : null}
              <ProfileFields kind={editor} prefix={creationFormId} description="" disabled={saving} />
            </form> : null}
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter className="px-6">
            <Button type="button" variant="outline" onClick={cancel}>Cancelar</Button>
            <Button type="submit" form={creationFormId} disabled={saving}>{saving ? "Guardando…" : followupTab === "observations" ? "Guardar bitácora" : "Guardar acompañamiento"}</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </Tabs>;
  }

  if (section === "interventions") {
    const creationFormId = `psychopedagogy-${student.id}-intervention-create`;
    return <div className="min-w-0 space-y-4">
      <PsychopedagogyInterventionTable profile={profile} />
      {!readOnly && !onInterventionActionsChange ? <div className="flex justify-end px-6">
        <Button type="button" onClick={() => startEditing("intervention")}>Nueva intervención</Button>
      </div> : null}
      <ResponsiveDialog open={!readOnly && editor === "intervention"} onOpenChange={(open) => { if (!open) cancel(); }}>
        <ResponsiveDialogContent className="[font-family:var(--font-montserrat)] md:w-[min(calc(100vw-2rem),44rem)]">
          <ResponsiveDialogHeader className="px-6 pt-6 pb-3">
            <ResponsiveDialogTitle className="[font-family:var(--font-montserrat)] text-lg text-primary">Nueva intervención</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{student.firstName} {student.lastName} · {student.group.name}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="px-6 pt-3 pb-6">
            {!readOnly && editor === "intervention" ? <form id={creationFormId} onSubmit={submit} className="space-y-4">
              {saveError ? <p role="alert" className="text-sm text-red-700">{saveError}</p> : null}
              <ProfileFields kind="intervention" prefix={creationFormId} description="" disabled={saving} />
            </form> : null}
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter className="px-6">
            <Button type="button" variant="outline" onClick={cancel}>Cancelar</Button>
            <Button type="submit" form={creationFormId} disabled={saving}>{saving ? "Guardando…" : "Guardar intervención"}</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>;
  }

  if (section === "instruments") {
    const creationFormId = `psychopedagogy-${student.id}-instrument-create`;
    return <div className="min-w-0 space-y-4">
      <PsychopedagogyInstrumentTable profile={profile} />
      {!readOnly && !onInstrumentActionsChange ? <div className="flex justify-end px-6">
        <Button type="button" onClick={() => startEditing("instrument")}>Registrar instrumento</Button>
      </div> : null}
      <ResponsiveDialog open={!readOnly && editor === "instrument"} onOpenChange={(open) => { if (!open) cancel(); }}>
        <ResponsiveDialogContent className="[font-family:var(--font-montserrat)] md:w-[min(calc(100vw-2rem),44rem)]">
          <ResponsiveDialogHeader className="px-6 pt-6 pb-3">
            <ResponsiveDialogTitle className="[font-family:var(--font-montserrat)] text-lg text-primary">Registrar instrumento</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{student.firstName} {student.lastName} · {student.group.name}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="px-6 pt-3 pb-6">
            {!readOnly && editor === "instrument" ? <form id={creationFormId} onSubmit={submit} className="space-y-4">
              {saveError ? <p role="alert" className="text-sm text-red-700">{saveError}</p> : null}
              <ProfileFields kind="instrument" prefix={creationFormId} description="" disabled={saving} />
            </form> : null}
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter className="px-6">
            <Button type="button" variant="outline" onClick={cancel}>Cancelar</Button>
            <Button type="submit" form={creationFormId} disabled={saving}>{saving ? "Guardando…" : "Guardar instrumento"}</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>;
  }

  return <div className="min-w-0 space-y-4">
    <ProfileRecords section={section} profile={profile} />
    {!readOnly ? editForm || <div className="flex flex-wrap gap-2">
      {actions[section].map((action) => <Button key={action.kind} type="button" variant="outline"
        onClick={() => startEditing(action.kind)}>{action.label}</Button>)}
    </div> : null}
  </div>;
}
