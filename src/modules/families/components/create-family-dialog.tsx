"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { PlusIcon, UserRoundPlusIcon, UsersRoundIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { createFamilyAction } from "@/modules/families/server/families.actions";
import type { CreateFamilyState } from "@/modules/families/server/families.actions";
import { listCandidateAdmissionsAction } from "@/modules/families/server/candidate-admissions.actions";

type CandidateAdmission = Awaited<ReturnType<typeof listCandidateAdmissionsAction>>[number];

const initialState: CreateFamilyState = { status: "idle", message: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" className="w-full" disabled={pending}>{pending ? "Creando familia..." : "Crear familia"}</Button>;
}

export function CreateFamilyDialog({ admissionInquiryId, initialName = "", initialEmail = "" }: {
  admissionInquiryId?: string;
  initialName?: string;
  initialEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"FAMILY" | "CANDIDATE">(admissionInquiryId ? "CANDIDATE" : "FAMILY");
  const [formVersion, setFormVersion] = useState(0);
  const [admissions, setAdmissions] = useState<CandidateAdmission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<CandidateAdmission | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();

  function loadAdmissions() {
    setLoadError(null);
    setAdmissions([]);
    startLoading(async () => {
      try {
        setAdmissions(await listCandidateAdmissionsAction());
      } catch {
        setLoadError("No pudimos cargar las solicitudes. Verificá tus permisos de Contactos y Familias o intentá nuevamente.");
      }
    });
  }

  function start(selectedKind: "FAMILY" | "CANDIDATE") {
    setKind(selectedKind);
    setSelectedAdmission(null);
    setFormVersion((current) => current + 1);
    setOpen(true);
    if (selectedKind === "CANDIDATE" && !admissionInquiryId) loadAdmissions();
  }

  const sourceId = admissionInquiryId ?? selectedAdmission?.id;
  const sourceName = admissionInquiryId ? initialName : selectedAdmission?.guardianNames || selectedAdmission?.childName || "";
  const sourceEmail = admissionInquiryId ? initialEmail : selectedAdmission?.email ?? "";
  const choosingAdmission = kind === "CANDIDATE" && !sourceId;
  return <>
    {admissionInquiryId ? <Button type="button" onClick={() => start("CANDIDATE")}>Crear familia candidata</Button> :
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button type="button" />}><PlusIcon /> Nueva familia</DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => start("FAMILY")}><UsersRoundIcon aria-hidden="true" />Familia</DropdownMenuItem>
          <DropdownMenuItem className="text-xs whitespace-nowrap" onClick={() => start("CANDIDATE")}><UserRoundPlusIcon aria-hidden="true" />Familia candidata</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>}
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogContent className="font-montserrat md:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle style={{ fontFamily: "var(--font-montserrat)" }}>{kind === "CANDIDATE" ? "Nueva familia candidata" : "Nueva familia"}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{choosingAdmission ? "Elegí una familia que haya enviado el cuestionario inicial. Sólo se muestran solicitudes que todavía no tienen una familia vinculada." : <>Enviá las invitaciones para completar los datos familiares. {sourceId ? "Precargamos los datos del cuestionario inicial. Podés corregir el nombre y los emails antes de crear la familia." : "Podés invitar a uno o dos responsables."}</>}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          {choosingAdmission ? (
            <div className="grid gap-3" aria-busy={isLoading}>
              {isLoading ? <p role="status" className="text-sm text-slate-600">Cargando solicitudes...</p> : loadError ? <>
                <p role="alert" className="text-sm text-red-600">{loadError}</p>
                <Button type="button" variant="outline" onClick={loadAdmissions}>Reintentar</Button>
              </> : admissions.length === 0 ? <p role="status" className="text-sm text-slate-600">No hay solicitudes del cuestionario inicial disponibles para crear una familia candidata.</p> : (
                <div className="grid max-h-80 gap-2 overflow-y-auto" aria-label="Solicitudes del cuestionario inicial">
                  {admissions.map((admission) => <Button key={admission.id} type="button" variant="outline" className="h-auto w-full justify-start whitespace-normal py-3 text-left" onClick={() => { setSelectedAdmission(admission); setFormVersion((current) => current + 1); }}>
                    <span className="grid min-w-0 gap-1">
                      <span className="font-semibold">{admission.childName}</span>
                      <span className="text-sm text-slate-600">{admission.guardianNames}</span>
                      <span className="break-all text-xs text-slate-500">{admission.email}</span>
                    </span>
                  </Button>)}
                </div>
              )}
            </div>
          ) : <FamilyCreationForm key={formVersion} kind={kind} admissionInquiryId={sourceId} initialName={sourceId ? sourceName : initialName} initialEmail={sourceId ? sourceEmail : initialEmail}
            onBack={selectedAdmission ? () => { setSelectedAdmission(null); loadAdmissions(); } : undefined}
            onCreated={sourceId ? () => setAdmissions((current) => current.filter((admission) => admission.id !== sourceId)) : undefined}
          />}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  </>;
}

function BackToAdmissionsButton({ onBack }: { onBack: () => void }) {
  const { pending } = useFormStatus();
  return <Button type="button" variant="ghost" disabled={pending} onClick={onBack}>Volver a solicitudes</Button>;
}

function FamilyCreationForm({ kind, admissionInquiryId, initialName, initialEmail, onCreated, onBack }: {
  kind: "FAMILY" | "CANDIDATE";
  admissionInquiryId?: string;
  initialName: string;
  initialEmail: string;
  onCreated?: () => void;
  onBack?: () => void;
}) {
  const [state, formAction] = useActionState(async (previous: CreateFamilyState, formData: FormData) => {
    const result = await createFamilyAction(previous, formData);
    if (result.status === "success" || result.status === "warning") onCreated?.();
    return result;
  }, initialState);
  const created = state.status === "success" || state.status === "warning";
  return <form action={formAction} className="grid gap-4">
            <input type="hidden" name="kind" value={kind} />
            {admissionInquiryId && <input type="hidden" name="admissionInquiryId" value={admissionInquiryId} />}
            <fieldset className="grid gap-4" disabled={created}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Nombre de la familia
              <Input name="name" required minLength={2} maxLength={120} placeholder="Ej. García" defaultValue={initialName} autoFocus />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email principal
              <Input name="primaryEmail" type="email" required autoComplete="email" placeholder="familia@ejemplo.com" defaultValue={initialEmail} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Segundo email (opcional)
              <Input name="secondaryEmail" type="email" placeholder="otra-persona@ejemplo.com" />
            </label>
            </fieldset>
            {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-600" : state.status === "warning" ? "text-amber-700" : "text-emerald-700"}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
            {!created && <SubmitButton />}
            {onBack && <BackToAdmissionsButton onBack={onBack} />}
          </form>;
}
