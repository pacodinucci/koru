"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { TeacherReportItem, type TeacherReport } from "@/modules/teachers/components/teacher-report-item";

type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  group: { name: string };
};

type ReportRow = TeacherReport & {
  student: StudentOption;
  canManageVisibility?: boolean;
};

function ReportDetails({ report }: { report: ReportRow }) {
  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger render={<Button type="button" size="sm" variant="outline" />}>
        Ver reporte
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{report.title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Reporte de {report.student.lastName}, {report.student.firstName}.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <ul><TeacherReportItem report={report} student={report.student} /></ul>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export function TeacherReportsTable({
  reports,
  students,
  fixedStudent,
}: {
  reports: ReportRow[];
  students: StudentOption[];
  fixedStudent?: StudentOption;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [studentId, setStudentId] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [visibilityOverrides, setVisibilityOverrides] = useState<Record<string, boolean>>({});
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setVisibilityOverrides({}), [reports]);

  async function changeVisibility(report: ReportRow, visibleToFamily: boolean) {
    if (report.canManageVisibility === false) return;
    setPendingId(report.id);
    setError(null);
    try {
      const response = await fetch(`/api/teacher/reports/${encodeURIComponent(report.id)}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibleToFamily }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? "No pudimos cambiar la visibilidad.");
      setVisibilityOverrides((current) => ({ ...current, [report.id]: visibleToFamily }));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cambiar la visibilidad.");
    } finally {
      setPendingId(null);
    }
  }

  async function deleteReport(report: ReportRow) {
    if (report.canManageVisibility === false || pendingId !== null) return;
    setPendingId(report.id);
    try {
      const response = await fetch(`/api/teacher/reports/${encodeURIComponent(report.id)}`, { method: "DELETE" });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error ?? "No pudimos eliminar el reporte.");
      setSelectedReport(null);
      setDeletedIds((current) => [...current, report.id]);
      toast("Reporte eliminado.", "success");
      router.refresh();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "No pudimos eliminar el reporte.", "error");
    } finally {
      setPendingId(null);
    }
  }

  const availableReports = reports.filter((report) => !deletedIds.includes(report.id));

  if (availableReports.length === 0) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground">
      {fixedStudent
        ? "Todavía no hay reportes de este alumno."
        : students.length === 0
          ? "Todavía no tenés alumnos asignados."
          : "Todavía no cargaste reportes."}
    </div>;
  }

  const filtered = fixedStudent
    ? availableReports
    : studentId ? availableReports.filter((report) => report.student.id === studentId) : availableReports;

  return (
    <div className="space-y-3">
      {!fixedStudent ? <div className="space-y-1.5">
        <Label htmlFor="report-student-filter">Filtrar por alumno</Label>
        <select id="report-student-filter" value={studentId} onChange={(event) => setStudentId(event.target.value)}
          className="h-9 w-full max-w-sm rounded-lg border border-input bg-background px-2.5 text-sm">
          <option value="">Todos los alumnos</option>
          {students.map((student) => <option key={student.id} value={student.id}>
            {student.lastName}, {student.firstName} · {student.group.name}
          </option>)}
        </select>
      </div> : null}
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="hidden w-[12%] md:table-cell">Fecha</TableHead>
              <TableHead className="w-[30%] md:w-[20%]">{fixedStudent ? "Docente" : "Alumno"}</TableHead>
              <TableHead className="w-[40%] md:w-[28%]">Reporte</TableHead>
              <TableHead className="hidden w-[10%] md:table-cell">Tipo</TableHead>
              <TableHead className="hidden w-[14%] md:table-cell">Detalle</TableHead>
              <TableHead className="w-[30%] md:w-[16%]">Familia</TableHead>
              <TableHead className="w-[16%]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No hay reportes para este alumno.</TableCell></TableRow> : filtered.map((report) => {
              const visible = visibilityOverrides[report.id] ?? report.visibleToFamily;
              return <TableRow key={report.id}>
                <TableCell className="hidden md:table-cell">{new Date(report.createdAt).toLocaleDateString("es-AR")}</TableCell>
                <TableCell>{fixedStudent ? report.teacher.displayName : `${report.student.lastName}, ${report.student.firstName}`}</TableCell>
                <TableCell className="font-medium">
                  {report.title}
                  <span className="mt-1 block text-xs font-normal text-muted-foreground md:hidden">
                    {new Date(report.createdAt).toLocaleDateString("es-AR")} · {report.type === "TEXT" ? "Texto" : report.type}
                  </span>
                  <div className="mt-2 md:hidden"><ReportDetails report={{ ...report, visibleToFamily: visible }} /></div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{report.type === "TEXT" ? "Texto" : report.type}</TableCell>
                <TableCell className="hidden md:table-cell"><ReportDetails report={{ ...report, visibleToFamily: visible }} /></TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <Switch
                      checked={visible}
                      aria-label={`Visible para la familia: ${report.title} de ${report.student.firstName} ${report.student.lastName}`}
                      disabled={pendingId !== null || report.canManageVisibility === false}
                      onCheckedChange={(checked) => void changeVisibility(report, checked)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {visible ? "Visible" : "Privado"}
                      {report.canManageVisibility === false ? <span className="block">Solo el autor puede cambiarlo</span> : null}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {report.canManageVisibility !== false ? <Button type="button" size="icon-sm" variant="destructive" aria-label={`Eliminar reporte ${report.title}`} title={`Eliminar reporte ${report.title}`} disabled={pendingId !== null} onClick={() => setSelectedReport(report)}><Trash2 /></Button> : null}
                </TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table>
      </div>
      {selectedReport ? <ResponsiveDialog open onOpenChange={(open) => { if (!open && pendingId === null) setSelectedReport(null); }}>
        <ResponsiveDialogContent showCloseButton={pendingId === null} className="md:w-[min(calc(100vw-2rem),28rem)] [font-family:var(--font-montserrat)]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Eliminar reporte</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Esta acción no se puede deshacer.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="space-y-3">
            <p>Vas a eliminar definitivamente el reporte <strong>{selectedReport.title}</strong> de {selectedReport.student.firstName} {selectedReport.student.lastName}. La familia dejará de verlo.</p>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose render={<Button type="button" variant="outline" disabled={pendingId !== null}>Cancelar</Button>} />
            <Button type="button" variant="destructive" disabled={pendingId !== null} onClick={() => void deleteReport(selectedReport)}>{pendingId === selectedReport.id ? "Eliminando…" : "Eliminar definitivamente"}</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog> : null}
    </div>
  );
}
