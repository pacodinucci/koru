"use client";

import { Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  saveFamilyStudentMedicalAction,
  updateFamilyStudentPersonalAction,
} from "@/modules/family-dashboard/server/family-student-record.actions";

const underlineInput = "w-full rounded-none border-0 border-b border-slate-300 bg-transparent px-0 shadow-none outline-none ring-0 focus-visible:border-slate-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none";
const underlineSelect = "h-8 w-full rounded-none border-0 border-b border-slate-300 bg-transparent px-0 text-sm outline-none ring-0 focus:border-slate-300 focus:ring-0";
const underlineTextarea = "min-h-8 w-full resize-y rounded-none border-0 border-b border-slate-300 bg-transparent px-0 py-1 text-sm outline-none ring-0 focus:border-slate-300 focus:ring-0";
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type GroupOption = { id: string; name: string };
type PersonalDetails = {
  studentId: string;
  documentType: string | null;
  documentNumber: string | null;
  birthDate: string;
  groupId: string;
  groupName: string;
  primaryGuardianName: string | null;
};
type MedicalDetails = {
  studentId: string;
  bloodType: string | null;
  knownAllergies: string | null;
  medicalConditions: string | null;
  regularMedications: string | null;
  hasHealthInsurance: boolean;
  insuranceProviderAndPolicy: string | null;
};

function Field({ label, id, value, editing, children }: {
  label: string;
  id: string;
  value?: string | null;
  editing: boolean;
  children: React.ReactNode;
}) {
  return <div className="min-w-0">
    <dt className="text-xs font-medium text-muted-foreground">
      {editing ? <label htmlFor={id}>{label}</label> : label}
    </dt>
    <dd className="mt-1 text-sm">{editing ? children : value || "No informado"}</dd>
  </div>;
}

function EditControls({ title, editing, pending, onEdit, onCancel }: {
  title: string;
  editing: boolean;
  pending: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return <div className="mb-3 flex items-center justify-between gap-3">
    <div className="flex items-center gap-1">
      <h2 className="font-semibold">{title}</h2>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={editing ? `Cancelar edición de ${title.toLowerCase()}` : `Editar ${title.toLowerCase()}`}
        onClick={editing ? onCancel : onEdit}
        disabled={pending}
      >
        {editing ? <X className="size-4" /> : <Pencil className="size-4" />}
      </Button>
    </div>
    {editing ? <Button type="submit" size="sm" disabled={pending}>{pending ? "Guardando..." : "Guardar"}</Button> : null}
  </div>;
}

function personalForm(details: PersonalDetails) {
  return {
    documentType: details.documentType ?? "CURP",
    documentNumber: details.documentNumber ?? "",
    birthDate: details.birthDate.slice(0, 10),
    groupId: details.groupId,
    primaryGuardianName: details.primaryGuardianName ?? "",
  };
}

export function FamilyStudentPersonalSection({ details, groups }: { details: PersonalDetails; groups: GroupOption[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => personalForm(details));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const prefix = `personal-${details.studentId}`;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateFamilyStudentPersonalAction({ studentId: details.studentId, ...form });
      if (!result.ok) {
        setError(result.error === "student_identity_conflict"
          ? "Ya existe otro niño con ese documento o con la misma identidad en la familia."
          : result.error === "invalid_birth_date"
            ? "Revisá la fecha de nacimiento."
            : result.error === "group_not_found"
              ? "El grupo seleccionado ya no está disponible."
              : "No pudimos guardar los datos personales. Revisá los campos e intentá de nuevo.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return <form onSubmit={submit}>
    <EditControls title="Datos personales" editing={editing} pending={pending} onEdit={() => { setForm(personalForm(details)); setError(null); setEditing(true); }} onCancel={() => { setError(null); setEditing(false); }} />
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Documento" id={`${prefix}-document`} value={[details.documentType, details.documentNumber].filter(Boolean).join(" ")} editing={editing}>
        <div className="space-y-1">
          <Input id={`${prefix}-document`} className={underlineInput} value={form.documentNumber} onChange={(event) => update("documentNumber", event.target.value)} maxLength={40} placeholder="Número (opcional)" />
          <Input className={underlineInput} value={form.documentType} onChange={(event) => update("documentType", event.target.value)} maxLength={40} aria-label="Tipo de documento" placeholder="Tipo de documento" />
        </div>
      </Field>
      <Field label="Fecha de nacimiento" id={`${prefix}-birth-date`} value={new Date(details.birthDate).toLocaleDateString("es-AR")} editing={editing}>
        <Input id={`${prefix}-birth-date`} type="date" className={underlineInput} value={form.birthDate} onChange={(event) => update("birthDate", event.target.value)} required />
      </Field>
      <Field label="Grupo" id={`${prefix}-group`} value={details.groupName} editing={editing}>
        <select id={`${prefix}-group`} className={underlineSelect} value={form.groupId} onChange={(event) => update("groupId", event.target.value)} required>
          {!groups.some((group) => group.id === details.groupId) ? <option value={details.groupId}>{details.groupName}</option> : null}
          {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
      </Field>
      <Field label="Responsable principal" id={`${prefix}-guardian`} value={details.primaryGuardianName} editing={editing}>
        <Input id={`${prefix}-guardian`} className={underlineInput} value={form.primaryGuardianName} onChange={(event) => update("primaryGuardianName", event.target.value)} maxLength={120} />
      </Field>
    </dl>
    {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
  </form>;
}

function medicalForm(details: MedicalDetails) {
  return {
    bloodType: details.bloodType ?? "",
    knownAllergies: details.knownAllergies ?? "",
    medicalConditions: details.medicalConditions ?? "",
    regularMedications: details.regularMedications ?? "",
    hasHealthInsurance: details.hasHealthInsurance,
    insuranceProviderAndPolicy: details.insuranceProviderAndPolicy ?? "",
  };
}

export function FamilyStudentMedicalSection({ details }: { details: MedicalDetails }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => medicalForm(details));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const prefix = `medical-${details.studentId}`;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveFamilyStudentMedicalAction({ studentId: details.studentId, ...form });
      if (!result.ok) {
        setError("No pudimos guardar los datos de salud. Revisá los campos e intentá de nuevo.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return <form onSubmit={submit}>
    <EditControls title="Salud" editing={editing} pending={pending} onEdit={() => { setForm(medicalForm(details)); setError(null); setEditing(true); }} onCancel={() => { setError(null); setEditing(false); }} />
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Sangre y Rh" id={`${prefix}-blood`} value={details.bloodType} editing={editing}>
        <select id={`${prefix}-blood`} className={underlineSelect} value={form.bloodType} onChange={(event) => update("bloodType", event.target.value)}>
          <option value="">No informado</option>
          {details.bloodType && !bloodTypes.includes(details.bloodType) ? <option value={details.bloodType}>{details.bloodType}</option> : null}
          {bloodTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </Field>
      <Field label="Alergias" id={`${prefix}-allergies`} value={details.knownAllergies} editing={editing}>
        <Input id={`${prefix}-allergies`} className={underlineInput} value={form.knownAllergies} onChange={(event) => update("knownAllergies", event.target.value)} />
      </Field>
      <Field label="Condiciones médicas" id={`${prefix}-conditions`} value={details.medicalConditions} editing={editing}>
        <Input id={`${prefix}-conditions`} className={underlineInput} value={form.medicalConditions} onChange={(event) => update("medicalConditions", event.target.value)} />
      </Field>
      <Field label="Medicación" id={`${prefix}-medication`} value={details.regularMedications} editing={editing}>
        <textarea id={`${prefix}-medication`} className={underlineTextarea} value={form.regularMedications} onChange={(event) => update("regularMedications", event.target.value)} rows={1} />
      </Field>
      <Field label="Cobertura" id={`${prefix}-insurance`} value={details.hasHealthInsurance ? "Sí" : "No"} editing={editing}>
        <select id={`${prefix}-insurance`} className={underlineSelect} value={form.hasHealthInsurance ? "yes" : "no"} onChange={(event) => update("hasHealthInsurance", event.target.value === "yes")}>
          <option value="no">No</option><option value="yes">Sí</option>
        </select>
      </Field>
      <Field label="Institución / afiliación" id={`${prefix}-provider`} value={details.insuranceProviderAndPolicy} editing={editing}>
        <Input id={`${prefix}-provider`} className={underlineInput} value={form.insuranceProviderAndPolicy} onChange={(event) => update("insuranceProviderAndPolicy", event.target.value)} disabled={!form.hasHealthInsurance} required={form.hasHealthInsurance} />
      </Field>
    </dl>
    {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
  </form>;
}
