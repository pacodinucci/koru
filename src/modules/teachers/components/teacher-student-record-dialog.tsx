"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { Separator } from "@/components/ui/separator";
import { TeacherReportItem, type TeacherReport } from "@/modules/teachers/components/teacher-report-item";

type StudentRecord = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  documentType: string | null;
  documentNumber: string | null;
  recordStatus: "DRAFT" | "SUBMITTED" | "REVIEWED" | "NEEDS_CHANGES";
  group: { name: string; ageRange: string };
  medicalProfile: {
    bloodType: string | null;
    knownAllergies: string | null;
    medicalConditions: string | null;
    regularMedications: string | null;
    hasHealthInsurance: boolean;
    insuranceProviderAndPolicy: string | null;
  } | null;
  reports: TeacherReport[];
  reportsAvailable: boolean;
  reportsError: string | null;
};

const recordStatusLabels: Record<StudentRecord["recordStatus"], string> = {
  DRAFT: "En progreso",
  SUBMITTED: "Pendiente de revisión",
  REVIEWED: "Revisada",
  NEEDS_CHANGES: "Requiere cambios",
};

function Value({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm">{value || "No informado"}</dd>
    </div>
  );
}

export function TeacherStudentRecordDialog({ studentId, name }: { studentId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<StudentRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setRecord(null);
    setError(null);

    async function load() {
      try {
        const response = await fetch(`/api/teacher/students/${encodeURIComponent(studentId)}/reports`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json().catch(() => null) as { student?: StudentRecord; error?: string } | null;
        if (!response.ok || !result?.student) {
          throw new Error(result?.error ?? "No pudimos cargar el expediente.");
        }
        if (!controller.signal.aborted) setRecord(result.student);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "No pudimos cargar el expediente.");
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [open, studentId]);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger render={<Button type="button" variant="link" className="h-auto p-0 text-left font-medium whitespace-normal" />}>
        {name}<span className="sr-only">: abrir expediente y reportes</span>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="[font-family:var(--font-montserrat)] [&_*]:[font-family:var(--font-montserrat)]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Expediente de {name}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Datos cargados por la familia al ingresar y reportes compartidos con ella.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-6">
          {!record && !error ? <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Cargando expediente…</p> : null}
          {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          {record ? (
            <>
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">Datos personales cargados por la familia</h3>
                  <Badge variant="secondary">{recordStatusLabels[record.recordStatus]}</Badge>
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Value label="Nombre(s) del aprendiz" value={record.firstName} />
                  <Value label="Apellidos" value={record.lastName} />
                  <Value label="CURP / Documento de identidad" value={record.documentNumber ? [record.documentType, record.documentNumber].filter(Boolean).join(" ") : null} />
                  <Value label="Fecha de nacimiento" value={new Date(record.birthDate).toLocaleDateString("es-AR", { timeZone: "UTC" })} />
                  <Value label="Grupo / grado" value={`${record.group.name} · ${record.group.ageRange}`} />
                </dl>
              </section>
              <Separator />
              <section className="space-y-3">
                <h3 className="font-semibold">Datos de salud cargados por la familia</h3>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Value label="Tipo de sangre y Rh" value={record.medicalProfile?.bloodType} />
                  <Value label="Alergias conocidas" value={record.medicalProfile?.knownAllergies} />
                  <Value label="Condiciones médicas o crónicas" value={record.medicalProfile?.medicalConditions} />
                  <Value label="Medicamentos de uso regular" value={record.medicalProfile?.regularMedications} />
                  <Value label="Cuenta con cobertura médica" value={record.medicalProfile ? (record.medicalProfile.hasHealthInsurance ? "Sí" : "No") : null} />
                  {record.medicalProfile?.hasHealthInsurance ? <Value label="Institución y número de afiliación" value={record.medicalProfile.insuranceProviderAndPolicy} /> : null}
                </dl>
              </section>
              <Separator />
              <section className="space-y-3">
                <h3 className="font-semibold">Reportes</h3>
                {!record.reportsAvailable ? (
                  <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{record.reportsError}</p>
                ) : record.reports.length ? (
                  <ul className="space-y-3">{record.reports.map((report) => <TeacherReportItem key={report.id} report={report} />)}</ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Todavía no hay reportes.</p>
                )}
              </section>
            </>
          ) : null}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
