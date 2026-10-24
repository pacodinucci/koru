"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PsychopedagogyFollowupTable } from "./psychopedagogy-followup-table";
import { instrumentKindLabels, type InstrumentKind, type PsychopedagogyProfileDTO, type PsychopedagogyProfilePayload } from "../lib/profile-contract";

export type EditorKind = PsychopedagogyProfilePayload["section"] | "observation";
export const learningReportPanelClassName = "min-h-[20rem] rounded-xl border border-primary/40 bg-background p-5 sm:min-h-[24rem]";
export const interventionFields = [
  ["observationAnalysis", "Observación y análisis"],
  ["strategyFeedback", "Retroalimentación y diseño de estrategia"],
  ["workPlan", "Plan de trabajo"],
  ["implementation", "Implementación"],
  ["evaluationResults", "Evaluación y resultados"],
] as const;

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ProfileFields({ kind, prefix, description, disabled }: {
  kind: EditorKind; prefix: string; description: string; disabled: boolean;
}) {
  function field(name: string, label: string, multiline = false, defaultValue?: string) {
    const id = `${prefix}-${name}`;
    return <div key={name} className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? <textarea id={id} name={name} rows={kind === "learning" ? 12 : 5} maxLength={10000} required disabled={disabled}
        defaultValue={defaultValue} className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${kind === "learning" ? "min-h-[18rem] resize-y" : ""}`} />
        : <Input id={id} name={name} maxLength={160} required disabled={disabled} />}
    </div>;
  }
  if (kind === "learning") return field("description", "Descripción del estilo de aprendizaje y temperamento", true, description);
  return <>
    <div className="space-y-1.5">
      <Label htmlFor={`${prefix}-date`}>Fecha</Label>
      <Input id={`${prefix}-date`} name="date" type="date" defaultValue={today()} required disabled={disabled} />
    </div>
    {kind === "accompaniment" ? <div className="space-y-1.5">
      <Label htmlFor={`${prefix}-kind`}>Tipo de acompañamiento</Label>
      <select id={`${prefix}-kind`} name="kind" defaultValue="INDIVIDUAL" required disabled={disabled}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
        <option value="INDIVIDUAL">Individual</option><option value="FAMILY">Familiar</option>
      </select>
    </div> : null}
    {kind === "instrument" ? <div className="space-y-1.5">
      <Label htmlFor={`${prefix}-kind`}>Tipo de instrumento</Label>
      <select id={`${prefix}-kind`} name="kind" defaultValue="" required disabled={disabled}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
        <option value="" disabled>Seleccioná un tipo</option>
        {(Object.keys(instrumentKindLabels) as InstrumentKind[]).map((value) => <option key={value} value={value}>{instrumentKindLabels[value]}</option>)}
      </select>
    </div> : null}
    {field(kind === "instrument" ? "name" : "title", kind === "instrument" ? "Nombre del instrumento" : "Título")}
    {kind === "intervention" ? interventionFields.map(([name, label]) => field(name, label, true)) : field("body", "Texto", true)}
  </>;
}

function EntryCard({ entry, title, children }: { entry: { entryDate: string }; title: string; children: ReactNode }) {
  const date = entry.entryDate.slice(0, 10);
  return <article className="space-y-2 rounded-xl border border-slate-200 bg-background p-4">
    <time dateTime={date} className="text-sm text-muted-foreground">{date.split("-").reverse().join("/")}</time>
    <h4 className="break-words font-semibold text-slate-900">{title}</h4>
    {children}
  </article>;
}
const bodyText = (body: string) => <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{body}</p>;

export function ProfileRecords({ section, profile, learningAction }: {
  section: "learning" | "followups" | "interventions" | "instruments";
  profile: PsychopedagogyProfileDTO;
  learningAction?: ReactNode;
}) {
  if (section === "learning") return <article className={`relative ${learningReportPanelClassName}`} aria-label="Reporte de estilo de aprendizaje y temperamento">
    <h3 className="sr-only">Reporte del alumno</h3>
    {learningAction ? <div className="absolute right-3 top-3">{learningAction}</div> : null}
    <div className={learningAction ? "pr-12" : undefined}>
      {bodyText(profile.learningStyleAndTemperament || "Todavía no hay una descripción registrada.")}
    </div>
  </article>;
  if (section === "followups") return <div className="space-y-5">
    <div className="space-y-3">
      <h3 className="font-semibold">Bitácoras de observación (situaciones reportadas y comunicación familiar)</h3>
      <PsychopedagogyFollowupTable profile={profile} tab="observations" />
    </div>
    <div className="space-y-3">
      <h3 className="font-semibold">Acompañamientos</h3>
      <PsychopedagogyFollowupTable profile={profile} tab="accompaniments" />
    </div>
  </div>;
  if (section === "interventions") return <div className="space-y-3">
    <h3 className="font-semibold">Informe psicopedagógico</h3>
    {profile.interventions.length ? profile.interventions.map((entry) => <EntryCard key={entry.id} entry={entry} title={entry.title}>
      <dl className="space-y-3">{interventionFields.map(([name, label]) => <div key={name}>
        <dt className="text-sm font-medium">{label}</dt><dd>{bodyText(entry[name])}</dd>
      </div>)}</dl>
    </EntryCard>) : <p className="text-sm text-muted-foreground">Todavía no hay intervenciones registradas.</p>}
  </div>;
  return <div className="space-y-3">
    <p className="text-sm text-muted-foreground">Cuestionarios, pruebas, entrevistas, test, etc.</p>
    {profile.instruments.length ? profile.instruments.map((entry) => <EntryCard key={entry.id} entry={entry} title={entry.name}>{bodyText(entry.body)}</EntryCard>)
      : <p className="text-sm text-muted-foreground">Todavía no hay instrumentos registrados.</p>}
  </div>;
}
