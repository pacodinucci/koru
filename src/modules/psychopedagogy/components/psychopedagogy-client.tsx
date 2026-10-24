"use client";

import Link from "next/link";
import { useState } from "react";
import { Brain, NotebookPen, ClipboardList, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent,
  ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import type { StudentOption, PsychopedagogyProfileSection as SectionKey } from "../lib/profile-contract";
import { PsychopedagogyProfileSection, profileSectionLabels, type LearningEditorState, type FollowupActions } from "./psychopedagogy-profile";

const sectionIcons = [
  { section: "learning", Icon: Brain }, { section: "followups", Icon: NotebookPen },
  { section: "interventions", Icon: ClipboardList }, { section: "instruments", Icon: ListChecks },
] as const;

export function PsychopedagogyClient({ students, readOnly = false, canEditLearning = false, canEditFollowups = false, canEditInterventions = false, canEditInstruments = false }: { students: StudentOption[]; readOnly?: boolean; canEditLearning?: boolean; canEditFollowups?: boolean; canEditInterventions?: boolean; canEditInstruments?: boolean }) {
  const [filter, setFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selection, setSelection] = useState<{ student: StudentOption; section: SectionKey } | null>(null);
  const [learningState, setLearningState] = useState<LearningEditorState>({ editing: false, saving: false });
  const [followupActions, setFollowupActions] = useState<FollowupActions | null>(null);
  const [interventionActions, setInterventionActions] = useState<FollowupActions | null>(null);
  const [instrumentActions, setInstrumentActions] = useState<FollowupActions | null>(null);
  const isTableModal = selection?.section === "followups" || selection?.section === "interventions" || selection?.section === "instruments";
  const isReportModal = selection?.section === "learning" || isTableModal;
  const learningFormId = selection?.section === "learning" ? `psychopedagogy-modal-${selection.student.id}-learning` : undefined;
  const query = filter.trim().toLocaleLowerCase("es");
  const filteredStudents = students.filter((student) =>
    `${student.firstName} ${student.lastName} ${student.firstName}`.toLocaleLowerCase("es").includes(query));
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageStudents = filteredStudents.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return <div className="min-w-0 space-y-5">
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input type="search" aria-label="Buscar alumnos por nombre o apellido" placeholder="Buscar por nombre o apellido"
          className="sm:max-w-sm" value={filter} onChange={(event) => { setFilter(event.target.value); setPageIndex(0); }} />
        <p className="text-sm text-slate-600" role="status">{filteredStudents.length} {filteredStudents.length === 1 ? "alumno" : "alumnos"}</p>
      </div>
      <div className="min-w-0 overflow-x-auto rounded-xl border border-slate-200">
        <Table className="min-w-[760px] table-fixed">
          <colgroup>
            <col style={{ width: "36%" }} /><col style={{ width: "26%" }} />
            <col style={{ width: "14%" }} /><col style={{ width: "24%" }} />
          </colgroup>
          <TableHeader><TableRow>
            <TableHead>Apellido y nombre</TableHead><TableHead>Curso</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-center"><span className="sr-only">Perfil psicopedagógico</span></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {pageStudents.length === 0 ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
              {students.length === 0 ? "No hay alumnos registrados." : "No encontramos alumnos con esa búsqueda."}
            </TableCell></TableRow> : null}
            {pageStudents.map((student) => <TableRow key={student.id}>
              <TableCell className="whitespace-normal break-words"><Link href={`/dashboard/students/${student.id}`}
                className="font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                {student.lastName}, {student.firstName}
              </Link></TableCell>
              <TableCell className="whitespace-normal break-words">{student.group.name}</TableCell>
              <TableCell className="text-center"><span aria-label="Sin estado de seguimiento" title="El estado de seguimiento todavía no está definido.">—</span></TableCell>
              <TableCell className="text-center">
                <div className="mx-auto flex min-w-[160px] items-center justify-center gap-1" role="group" aria-label={`Perfil psicopedagógico de ${student.firstName} ${student.lastName}`}>
                  {sectionIcons.map(({ section, Icon }) => <Button key={section} type="button" size="icon" variant="ghost" className="size-9 shrink-0"
                    aria-label={`Ver ${profileSectionLabels[section].toLocaleLowerCase("es")} de ${student.firstName} ${student.lastName}`}
                    title={profileSectionLabels[section]} onClick={() => { setLearningState({ editing: false, saving: false }); setFollowupActions(null); setInterventionActions(null); setInstrumentActions(null); setSelection({ student, section }); }}>
                    <Icon className="size-4" aria-hidden="true" />
                  </Button>)}
                </div>
              </TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>Página {currentPage + 1} de {pageCount}</span>
        <div className="flex items-center gap-2">
          <select aria-label="Filas por página" className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageIndex(0); }}>
            {[10, 20, 50].map((size) => <option key={size} value={size}>{size} por página</option>)}
          </select>
          <Button type="button" size="sm" variant="outline" disabled={currentPage === 0} onClick={() => setPageIndex(currentPage - 1)}>Anterior</Button>
          <Button type="button" size="sm" variant="outline" disabled={currentPage >= pageCount - 1} onClick={() => setPageIndex(currentPage + 1)}>Siguiente</Button>
        </div>
      </div>
    </div>
    <ResponsiveDialog open={Boolean(selection)} onOpenChange={(open) => { if (!open) setSelection(null); }}>
      <ResponsiveDialogContent className={isReportModal
        ? "[font-family:var(--font-montserrat)] md:w-[min(calc(100vw-2rem),44rem)]"
        : "[font-family:var(--font-montserrat)]"}>
        <ResponsiveDialogHeader className={isReportModal ? "px-6 pt-6 pb-3" : undefined}>
          <ResponsiveDialogTitle className={isReportModal ? "[font-family:var(--font-montserrat)] text-lg text-primary" : "[font-family:var(--font-montserrat)]"}>{selection ? profileSectionLabels[selection.section] : "Perfil psicopedagógico"}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{selection?.student.firstName} {selection?.student.lastName} · {selection?.student.group.name}{readOnly && !((canEditLearning && selection?.section === "learning") || (canEditFollowups && selection?.section === "followups") || (canEditInterventions && selection?.section === "interventions") || (canEditInstruments && selection?.section === "instruments")) ? " · Solo lectura" : ""}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className={isTableModal ? "px-0 pt-3 pb-6" : isReportModal ? "px-6 pt-3 pb-6" : undefined}>
          {selection ? <PsychopedagogyProfileSection student={selection.student} section={selection.section} readOnly={readOnly} canEditLearning={canEditLearning} canEditFollowups={canEditFollowups} canEditInterventions={canEditInterventions} canEditInstruments={canEditInstruments}
            onInstrumentActionsChange={selection.section === "instruments" ? setInstrumentActions : undefined}
            onInterventionActionsChange={selection.section === "interventions" ? setInterventionActions : undefined}
            followupsTabs={selection.section === "followups"} onFollowupActionsChange={selection.section === "followups" ? setFollowupActions : undefined} learningFormId={learningFormId} onLearningStateChange={selection.section === "learning" ? setLearningState : undefined} /> : null}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter columns={1} data-followup-actions={selection?.section === "followups" || undefined} data-intervention-actions={selection?.section === "interventions" || undefined} data-instrument-actions={selection?.section === "instruments" || undefined} className={isReportModal ? "flex flex-nowrap items-center justify-end gap-2 border-t-0 px-6 pt-0" : undefined}>
          {selection?.section === "followups" && followupActions ? <Button type="button" onClick={followupActions.create}>{followupActions.label}</Button> : null}
          {selection?.section === "interventions" && interventionActions ? <Button type="button" onClick={interventionActions.create}>{interventionActions.label}</Button> : null}
          {selection?.section === "instruments" && instrumentActions ? <Button type="button" onClick={instrumentActions.create}>{instrumentActions.label}</Button> : null}
          {selection?.section === "learning" && learningState.editing ? <Button type="submit" form={learningFormId} disabled={learningState.saving}>
            {learningState.saving ? "Guardando…" : "Guardar descripción"}
          </Button> : <Button type="button" variant="outline" onClick={() => setSelection(null)}>Cerrar</Button>}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  </div>;
}
