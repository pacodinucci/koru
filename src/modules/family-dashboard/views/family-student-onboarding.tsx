"use client";

import { CheckCircle2, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeFamilyStudentRecordAction,
  saveFamilyStudentIdentityAction,
  saveFamilyStudentMedicalAction,
} from "@/modules/family-dashboard/server/family-student-record.actions";

export type FamilyStudentRecordItem = {
  id: string;
  firstName: string;
  lastName: string;
  documentType: string | null;
  documentNumber: string | null;
  birthDate: string;
  groupId: string;
  recordStatus: "DRAFT" | "SUBMITTED" | "REVIEWED" | "NEEDS_CHANGES";
  recordStep: number;
  updatedAt: string;
  group: { id: string; name: string; ageRange: string };
  address: {
    streetAndNumber: string;
    neighborhood: string;
    cityAndState: string;
    postalCode: string;
  } | null;
  medicalProfile: {
    bloodType: string | null;
    knownAllergies: string | null;
    medicalConditions: string | null;
    regularMedications: string | null;
    hasHealthInsurance: boolean;
    insuranceProviderAndPolicy: string | null;
  } | null;
  guardians: Array<{
    fullName: string | null;
    phone: string | null;
    relationship: "MOTHER" | "FATHER" | "TUTOR" | "GUARDIAN" | "OTHER";
  }>;
  responsibles: Array<{
    fullName: string;
    relationship: string;
    phone: string;
    priority: number;
    canPickup: boolean;
    emergencyContact: boolean;
  }>;
};

type GroupOption = { id: string; name: string; ageRange: string };
type Relationship = FamilyStudentRecordItem["guardians"][number]["relationship"];

type FormState = {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  groupId: string;
  streetAndNumber: string;
  neighborhood: string;
  cityAndState: string;
  postalCode: string;
  bloodType: string;
  knownAllergies: string;
  medicalConditions: string;
  regularMedications: string;
  hasHealthInsurance: boolean;
  insuranceProviderAndPolicy: string;
  primaryFullName: string;
  primaryRelationship: Relationship;
  primaryPhone: string;
};

const statusLabels = {
  DRAFT: "En progreso",
  SUBMITTED: "Pendiente de revisión",
  REVIEWED: "Revisada",
  NEEDS_CHANGES: "Requiere cambios",
} as const;

const relationshipLabels: Record<Relationship, string> = {
  MOTHER: "Madre",
  FATHER: "Padre",
  TUTOR: "Tutor/a",
  GUARDIAN: "Responsable",
  OTHER: "Otro",
};

type FamilyAddress = { streetAndNumber: string | null; neighborhood: string | null; cityAndState: string | null; postalCode: string | null };

function emptyForm(userName: string, familyLastName: string, previousStudent?: FamilyStudentRecordItem, familyAddress?: FamilyAddress): FormState {
  const guardian = previousStudent?.guardians[0];

  return {
    firstName: "",
    lastName: familyLastName,
    documentType: "CURP",
    documentNumber: "",
    birthDate: "",
    groupId: "",
    streetAndNumber: familyAddress?.streetAndNumber ?? previousStudent?.address?.streetAndNumber ?? "",
    neighborhood: familyAddress?.neighborhood ?? previousStudent?.address?.neighborhood ?? "",
    cityAndState: familyAddress?.cityAndState ?? previousStudent?.address?.cityAndState ?? "",
    postalCode: familyAddress?.postalCode ?? previousStudent?.address?.postalCode ?? "",
    bloodType: "",
    knownAllergies: "",
    medicalConditions: "",
    regularMedications: "",
    hasHealthInsurance: false,
    insuranceProviderAndPolicy: "",
    primaryFullName: guardian?.fullName ?? userName,
    primaryRelationship: guardian?.relationship ?? "GUARDIAN",
    primaryPhone: guardian?.phone ?? "",
  };
}

function formFromStudent(student: FamilyStudentRecordItem, userName: string, familyLastName: string, familyAddress?: FamilyAddress): FormState {
  const guardian = student.guardians[0];
  return {
    ...emptyForm(userName, familyLastName, undefined, familyAddress),
    firstName: student.firstName,
    lastName: student.lastName,
    documentType: student.documentType ?? "CURP",
    documentNumber: student.documentNumber ?? "",
    birthDate: student.birthDate.slice(0, 10),
    groupId: student.groupId,
    streetAndNumber: student.address?.streetAndNumber ?? "",
    neighborhood: student.address?.neighborhood ?? "",
    cityAndState: student.address?.cityAndState ?? "",
    postalCode: student.address?.postalCode ?? "",
    bloodType: student.medicalProfile?.bloodType ?? "",
    knownAllergies: student.medicalProfile?.knownAllergies ?? "",
    medicalConditions: student.medicalProfile?.medicalConditions ?? "",
    regularMedications: student.medicalProfile?.regularMedications ?? "",
    hasHealthInsurance: student.medicalProfile?.hasHealthInsurance ?? false,
    insuranceProviderAndPolicy: student.medicalProfile?.insuranceProviderAndPolicy ?? "",
    primaryFullName: guardian?.fullName ?? userName,
    primaryRelationship: guardian?.relationship ?? "GUARDIAN",
    primaryPhone: guardian?.phone ?? "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FamilyActionsMenu({ onRegisterAnotherStudent }: { onRegisterAnotherStudent: () => void }) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const trigger = (
    <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Opciones de familia">
      <Settings2 />
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Opciones de familia</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pt-0">
            <Button type="button" variant="outline" className="w-full justify-start" onClick={() => { setIsOpen(false); onRegisterAnotherStudent(); }}>
              <Plus /> Registrar otro hijo/a
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onRegisterAnotherStudent}>
          <Plus /> Registrar otro hijo/a
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function FamilyStudentOnboarding({
  students,
  groups,
  userName,
  familyLastName,
  dashboardContent,
  startOnDashboard = false,
  familyAddress,
}: {
  students: FamilyStudentRecordItem[];
  groups: GroupOption[];
  userName: string;
  familyLastName: string;
  dashboardContent?: React.ReactNode;
  startOnDashboard?: boolean;
  familyAddress?: FamilyAddress;
}) {
  const router = useRouter();
  const initialDraft = students.find((student) => student.recordStatus === "DRAFT");
  const [showWizard, setShowWizard] = useState(
    students.length === 0 || (Boolean(initialDraft) && !startOnDashboard),
  );
  const [step, setStep] = useState(() => initialDraft ? Math.min(2, Math.max(1, initialDraft.recordStep)) : 1);
  const [studentId, setStudentId] = useState<string | null>(initialDraft?.id ?? null);
  const [form, setForm] = useState<FormState>(() =>
    initialDraft ? formFromStudent(initialDraft, userName, familyLastName, familyAddress) : emptyForm(userName, familyLastName, undefined, familyAddress),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [completedStudentName, setCompletedStudentName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function next() {
    setMessage(null);
    startTransition(async () => {
      if (step === 1) {
        const result = await saveFamilyStudentIdentityAction({
          studentId: studentId ?? undefined,
          firstName: form.firstName,
          lastName: form.lastName,
          documentType: form.documentType,
          documentNumber: form.documentNumber,
          birthDate: form.birthDate,
          groupId: form.groupId,
        });
        if (!result.ok) return setMessage(result.error === "student_identity_conflict" ? "Ya existe una ficha de este/a aprendiz en la familia. Revisá los datos o continuá esa ficha." : "Revisá los datos personales antes de continuar.");
        setStudentId(result.studentId);
        setStep(2);
        return;
      }

      if (!studentId) return setMessage("No pudimos identificar el expediente.");

      const result = await saveFamilyStudentMedicalAction({
        studentId,
        bloodType: form.bloodType,
        knownAllergies: form.knownAllergies,
        medicalConditions: form.medicalConditions,
        regularMedications: form.regularMedications,
        hasHealthInsurance: form.hasHealthInsurance,
        insuranceProviderAndPolicy: form.insuranceProviderAndPolicy,
      });
      if (!result.ok) return setMessage("Revisá los datos de salud antes de finalizar.");

      const completion = await completeFamilyStudentRecordAction({ studentId });
      if (!completion.ok) return setMessage("No pudimos finalizar la ficha. Intentá nuevamente.");

      setMessage(null);
      setCompletedStudentName(`${form.firstName} ${form.lastName}`.trim());
      setShowWizard(false);
      setStudentId(null);
      setStep(1);
      setForm(emptyForm(userName, familyLastName));
      router.refresh();
    });
  }

  function leaveWizard() {
    router.push("/family-dashboard?view=dashboard");
  }

  function startAnotherStudent() {
    setStudentId(null);
    setStep(1);
    setMessage(null);
    setCompletedStudentName(null);
    setForm(emptyForm(userName, familyLastName, students.at(-1), familyAddress));
    setShowWizard(true);
  }

  if (!showWizard) {
    if (completedStudentName) {
      return (
        <Card className="mx-auto max-w-xl text-center">
          <CardContent className="space-y-5 p-8">
            <CheckCircle2 className="mx-auto size-12 text-[var(--brand-600)]" />
            <div>
              <h1 className="text-2xl font-semibold">¡Listo! Registraste a {completedStudentName}.</h1>
              <p className="mt-2 text-sm text-muted-foreground">¿Necesitás registrar otro hijo/a?</p>
            </div>
            <div className="flex justify-center gap-3">
              <Button type="button" variant="outline" onClick={() => setCompletedStudentName(null)}>No, ir al inicio</Button>
              <Button type="button" onClick={startAnotherStudent}><Plus /> Sí, registrar otro</Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{["Familia", familyLastName].filter(Boolean).join(" ")}</h1>
            <p className="text-sm text-muted-foreground">Consultá el estado de las fichas registradas.</p>
          </div>
          <FamilyActionsMenu onRegisterAnotherStudent={startAnotherStudent} />
        </div>
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium">Domicilio</p>
          {familyAddress?.streetAndNumber && familyAddress.neighborhood && familyAddress.cityAndState && familyAddress.postalCode ? (
            <p className="mt-1 text-muted-foreground">
              {familyAddress.streetAndNumber}, {familyAddress.neighborhood}, {familyAddress.cityAndState} · CP {familyAddress.postalCode}
              <Link href="/family-dashboard/perfil" className="ml-2 font-medium text-[var(--brand-600)] hover:underline">Editar domicilio</Link>
            </p>
          ) : (
            <p className="mt-1 text-muted-foreground">
              Domicilio no configurado
              <Link href="/family-dashboard/perfil" className="ml-2 font-medium text-[var(--brand-600)] hover:underline">Agregar domicilio</Link>
            </p>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id} size="sm">
              <CardHeader>
                <CardTitle>{student.firstName} {student.lastName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Grupo</span>
                  <span>{student.group.name}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Ficha</span>
                  <Badge variant={student.recordStatus === "NEEDS_CHANGES" ? "destructive" : "secondary"}>
                    {statusLabels[student.recordStatus]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {dashboardContent}
      </div>
    );
  }

  return (
    <section className="w-full max-w-xl space-y-4">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-lg font-semibold text-slate-900">Carpeta integral del aprendiz</h1>
        <p className="mt-1 text-sm text-slate-500">Paso {step} de 2</p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-200" aria-label={`Paso ${step} de 4`}>
          <div className="h-full bg-[var(--brand-600)] transition-all" style={{ width: `${step * 50}%` }} />
        </div>
      </div>
      <div className="space-y-3">
        {step === 1 ? (
          <div className="space-y-3">
            <Field label="Nombre(s) del aprendiz"><Input value={form.firstName} onChange={(event) => update("firstName", event.target.value)} required /></Field>
            <Field label="Apellidos"><Input value={form.lastName} onChange={(event) => update("lastName", event.target.value)} required /></Field>
            <Field label="CURP / Documento de identidad (opcional)"><Input value={form.documentNumber} onChange={(event) => update("documentNumber", event.target.value)} placeholder="Si no cuenta con documento, validaremos nombre y fecha de nacimiento" maxLength={40} /></Field>
            <Field label="Fecha de nacimiento"><Input type="date" value={form.birthDate} onChange={(event) => update("birthDate", event.target.value)} required /></Field>
            <Field label="Grupo / grado">
              <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={form.groupId} onChange={(event) => update("groupId", event.target.value)} required>
                <option value="">Seleccioná una opción</option>
                {groups.map((group) => <option key={group.id} value={group.id}>{group.name} · {group.ageRange}</option>)}
              </select>
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <Field label="Tipo de sangre y Rh">
              <select className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={form.bloodType} onChange={(event) => update("bloodType", event.target.value)}>
                <option value="">No informado</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>
            <Field label="Alergias conocidas"><Input value={form.knownAllergies} onChange={(event) => update("knownAllergies", event.target.value)} placeholder="Ninguna o especificar" /></Field>
            <Field label="Condiciones médicas o crónicas"><Input value={form.medicalConditions} onChange={(event) => update("medicalConditions", event.target.value)} placeholder="Ninguna o especificar" /></Field>
            <Field label="Medicamentos de uso regular"><Textarea value={form.regularMedications} onChange={(event) => update("regularMedications", event.target.value)} placeholder="Nombre, dosis y autorización" /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" checked={form.hasHealthInsurance} onChange={(event) => update("hasHealthInsurance", event.target.checked)} /> Cuenta con cobertura médica</label>
            {form.hasHealthInsurance ? <div><Field label="Institución y número de afiliación"><Input value={form.insuranceProviderAndPolicy} onChange={(event) => update("insuranceProviderAndPolicy", event.target.value)} required /></Field></div> : null}
            <p className="text-xs text-muted-foreground">Estos datos son sensibles y solo estarán disponibles para personal autorizado.</p>
          </div>
        ) : null}


        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={leaveWizard} disabled={isPending}>Salir y continuar después</Button>
          <Button type="button" variant="secondary" className="flex-1" disabled={step === 1 || isPending} onClick={() => setStep((current) => Math.max(1, current - 1))}>Atrás</Button>
          <Button type="button" className="flex-1 bg-[var(--brand-600)] hover:bg-[var(--brand-700)]" disabled={isPending} onClick={next}>
            {isPending ? "Guardando..." : step === 2 ? <><CheckCircle2 /> Finalizar</> : "Guardar y continuar"}
          </Button>
        </div>
      </div>
    </section>
  );
}
