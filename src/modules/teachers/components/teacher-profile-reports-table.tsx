"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function reportTypeLabel(report: TeacherProfileReportRow) {
  return report.hasFile ? report.fileName?.split(".").pop()?.toUpperCase() ?? "Archivo" : "Texto";
}

// Only text that is already visible in a row participates in search.
function reportSearchText(report: TeacherProfileReportRow) {
  return [report.title, report.authorName, new Date(report.createdAt).toLocaleDateString("es-AR"), reportTypeLabel(report)]
    .join(" ")
    .toLowerCase();
}

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
  const [search, setSearch] = useState("");
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
    return <Card size="sm" className="min-w-0">
      <CardContent className="text-sm text-muted-foreground">Todavía no hay reportes de este docente.</CardContent>
    </Card>;
  }

  const matching = search.trim()
    ? availableReports.filter((report) => reportSearchText(report).includes(search.trim().toLowerCase()))
    : availableReports;

  return (
    <div className="min-w-0 space-y-4">
      <p className="text-xs text-muted-foreground">Visible para el docente: marca para uso futuro. El docente no puede acceder a los reportes por ahora.</p>
      <div aria-label="Buscar reportes" className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="w-full min-w-0 space-y-1 lg:w-64 lg:shrink-0">
          <Label htmlFor="teacher-profile-report-search" className="text-sm text-slate-600">Buscar</Label>
          <Input
            id="teacher-profile-report-search"
            type="search"
            placeholder="Buscar por reporte, autor, fecha o tipo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0"
          />
        </div>
      </div>
      {error && !selectedReport ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Card size="sm" className="min-w-0 bg-white">
        <CardContent className="min-w-0">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
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
              {matching.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No encontramos resultados para esta búsqueda.</TableCell></TableRow>
              ) : matching.map((report) => {
                const visible = visibilityOverrides[report.id] ?? report.visibleToTeacher;
                return (
                  <TableRow key={report.id}>
                    <TableCell>{new Date(report.createdAt).toLocaleDateString("es-AR")}</TableCell>
                    <TableCell>{report.authorName}</TableCell>
                    <TableCell className="font-medium">{report.title}</TableCell>
                    <TableCell>{reportTypeLabel(report)}</TableCell>
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
        </CardContent>
      </Card>
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
