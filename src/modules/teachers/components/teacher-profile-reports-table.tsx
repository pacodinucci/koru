"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogClose, ResponsiveDialogContent,
  ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader,
  ResponsiveDialogTitle, ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { StudentReportBody } from "@/modules/teachers/components/student-report-body";

// An explicit client-safe projection: private file URLs never belong in these props.
export type TeacherProfileReportRow = {
  id: string;
  title: string;
  content: string | null;
  fileName: string | null;
  fileMimeType: string | null;
  hasFile: boolean;
  createdAt: string;
  visibleToTeacher: boolean;
  authorName: string;
};

function ReportDetails({ report, teacherName }: { report: TeacherProfileReportRow; teacherName: string }) {
  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger render={<Button type="button" size="sm" variant="outline" />}>Ver reporte</ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{report.title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Reporte de {teacherName} · {report.authorName}.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <StudentReportBody body={report.content} />
          {report.hasFile ? (
            <a href={`/api/teacher-reports/${encodeURIComponent(report.id)}/download`} className="mt-3 inline-block text-sm text-primary underline">
              Descargar {report.fileName ?? "archivo"}
            </a>
          ) : null}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function TeacherProfileReportsTable({ reports, teacherName }: { reports: TeacherProfileReportRow[]; teacherName: string }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [visibilityOverrides, setVisibilityOverrides] = useState<Record<string, boolean>>({});
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<TeacherProfileReportRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeVisibility(report: TeacherProfileReportRow, visibleToTeacher: boolean) {
    if (pendingId !== null) return;
    setPendingId(report.id);
    setError(null);
    try {
      const response = await fetch(`/api/teacher-reports/${encodeURIComponent(report.id)}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibleToTeacher }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? "No pudimos cambiar la visibilidad.");
      setVisibilityOverrides((current) => ({ ...current, [report.id]: visibleToTeacher }));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cambiar la visibilidad.");
    } finally {
      setPendingId(null);
    }
  }

  async function deleteReport(report: TeacherProfileReportRow) {
    if (pendingId !== null) return;
    setPendingId(report.id);
    setError(null);
    try {
      const response = await fetch(`/api/teacher-reports/${encodeURIComponent(report.id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? "No pudimos eliminar el reporte.");
      setSelectedReport(null);
      setDeletedIds((current) => [...current, report.id]);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos eliminar el reporte.");
    } finally {
      setPendingId(null);
    }
  }

  const availableReports = reports.filter((report) => !deletedIds.includes(report.id));
  if (availableReports.length === 0) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground">Todavía no hay reportes de este docente.</div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Visible para el docente: marca para uso futuro. El docente no puede acceder a los reportes por ahora.</p>
      {error && !selectedReport ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Fecha</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Reporte</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead>Visible para el docente</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availableReports.map((report) => {
              const visible = visibilityOverrides[report.id] ?? report.visibleToTeacher;
              return (
                <TableRow key={report.id}>
                  <TableCell>{new Date(report.createdAt).toLocaleDateString("es-AR")}</TableCell>
                  <TableCell>{report.authorName}</TableCell>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>{report.hasFile ? report.fileName?.split(".").pop()?.toUpperCase() ?? "Archivo" : "Texto"}</TableCell>
                  <TableCell><ReportDetails report={report} teacherName={teacherName} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={visible} aria-label={`Visible para el docente: ${report.title}`} disabled={pendingId !== null}
                        onCheckedChange={(checked) => changeVisibility(report, checked)} />
                      <span className="text-xs text-muted-foreground">{visible ? "Visible (a futuro)" : "Privado"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button type="button" size="icon-sm" variant="destructive" aria-label={`Eliminar reporte ${report.title}`}
                      disabled={pendingId !== null} onClick={() => { setError(null); setSelectedReport(report); }}><Trash2 /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {selectedReport ? (
        <ResponsiveDialog open onOpenChange={(open) => { if (!open && pendingId === null) { setSelectedReport(null); setError(null); } }}>
          <ResponsiveDialogContent showCloseButton={pendingId === null}>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Eliminar reporte</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>Esta acción no se puede deshacer.</ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody className="space-y-3">
              <p>Vas a eliminar definitivamente el reporte <strong>{selectedReport.title}</strong> de {teacherName}.</p>
              {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
              <ResponsiveDialogClose render={<Button type="button" variant="outline" disabled={pendingId !== null}>Cancelar</Button>} />
              <Button type="button" variant="destructive" disabled={pendingId !== null} onClick={() => deleteReport(selectedReport)}>
                {pendingId === selectedReport.id ? "Eliminando…" : "Eliminar definitivamente"}
              </Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      ) : null}
    </div>
  );
}
