"use client";

import type { CalendarAccessScope } from "@/modules/calendar/lib/calendar-access";
import type { CalendarEventAreaFields, CalendarAreaFormOptions } from "@/modules/calendar/lib/calendar-area-types";
import { useId, useMemo, useState, type FormEvent } from "react";
import type {
  CalendarAudienceType,
  CalendarEventVisibility,
  UserRole,
} from "@prisma/client";

import { ResponsiveDialogClose } from "@/components/ui/responsive-dialog";
import { CalendarEventImageField } from "@/modules/dashboard/components/calendar-event-image-field";
import { CalendarEventGuestPicker } from "./calendar-event-guest-picker";
import { CalendarEventAttendanceDialog } from "@/modules/dashboard/components/calendar-event-attendance-dialog";
import {
  DEFAULT_CALENDAR_TIME_ZONE,
  calendarDateValue,
  calendarTimeValue,
} from "@/modules/calendar/lib/calendar-time-zone";

import {
  cancelCalendarEventAction,
} from "@/modules/dashboard/server/calendar.actions";

type EventItem = CalendarEventAreaFields & {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  timeZone: string;
  location?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  visibility: CalendarEventVisibility;
  audienceType: CalendarAudienceType;
  kind: "EVENT" | "MEETING";
  registrationsEnabled?: boolean;
  attendanceConfirmationEnabled?: boolean;
  attendances?: Array<{
    id: string;
    userId?: string | null;
    name: string;
    email: string;
    status: "PENDING" | "CONFIRMED" | "DECLINED";
    invitationSentAt?: Date | string | null;
    invitationError?: string | null;
    respondedAt?: Date | string | null;
  }>;
  audiences?: Array<{ userId: string }>;
};

type Props = CalendarAreaFormOptions & {
  users: Array<{ id: string; name: string; role: UserRole }>;
  ok?: string;
  error?: string;
  event?: EventItem;
  mode?: "create" | "edit";
};

const audienceOptions: Array<{ value: CalendarAudienceType; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "TEACHERS", label: "Maestros" },
  { value: "PARENTS", label: "Padres" },
  { value: "PRIVATE", label: "Privado" },
];

const visibilityOptions: Array<{ value: CalendarEventVisibility; label: string }> = [
  { value: "PUBLIC", label: "Público" },
  { value: "MEMBERS", label: "Privado" },
];

const saveErrorMessages: Record<string, string> = {
  invalid_date: "La fecha u hora no es válida en Ciudad de México.",
  event_forbidden: "No tenés permiso para modificar este evento.",
  invalid_event_areas: "Seleccioná un área responsable y las áreas involucradas.",
  missing_audience_areas: "Seleccioná al menos un área autorizada para consultar.",
  organizer_must_be_authorized: "Tu usuario debe tener acceso a la audiencia elegida para guardar el evento.",
  institutional_event_members_only: "Los eventos institucionales no se pueden publicar para visitantes.",
  ambiguous_date: "Esa hora ocurre dos veces en Ciudad de México por el cambio de horario. Elegí otra hora.",
};

function roleLabel(role: UserRole) {
  if (role === "SUPERADMIN") return "Superadmin";
  if (role === "ADMIN_OPERATOR") return "Admin operador";
  if (role === "ADMIN_TEACHER") return "Admin docente";
  if (role === "ADMIN") return "Administrador";
  if (role === "TEACHER") return "Maestro";
  return "Familia";
}

export function CalendarEventForm({ users, ok, error, event, mode = "create", areas = [], editableAreaIds = [], canManageCalendar = false, currentUserId }: Props) {
  const [accessScope, setAccessScope] = useState<CalendarAccessScope>(event?.accessScope ?? (areas.length ? "AREAS" : "LEGACY"));
  const [responsibleAreaId, setResponsibleAreaId] = useState(event?.responsibleAreaId ?? editableAreaIds[0] ?? "");
  const [involvedAreaIds, setInvolvedAreaIds] = useState<string[]>(event?.areaLinks?.map(link => link.areaId) ?? (editableAreaIds[0] ? [editableAreaIds[0]] : []));
  const [audienceAreaIds, setAudienceAreaIds] = useState<string[]>(event?.audienceAreas?.map(link => link.areaId) ?? (editableAreaIds[0] ? [editableAreaIds[0]] : []));
  const toggleArea = (ids: string[], id: string) => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
  const formId = useId();
  const fieldId = (name: string) => `${formId}-${name}`;
  const timeZone = DEFAULT_CALENDAR_TIME_ZONE;
  const initialVisibility = event?.visibility ?? "MEMBERS";
  const initialAudience =
    initialVisibility === "PUBLIC" ? "ALL" : event?.audienceType ?? "ALL";
  const [visibility, setVisibility] =
    useState<CalendarEventVisibility>(initialVisibility);
  const [audienceType, setAudienceType] = useState<CalendarAudienceType>(initialAudience);
  const [registrationsEnabled, setRegistrationsEnabled] = useState(event?.registrationsEnabled ?? false);
  const [attendanceConfirmationEnabled, setAttendanceConfirmationEnabled] = useState(
    event?.attendanceConfirmationEnabled ?? false,
  );

  const durationDefault = useMemo(() => {
    if (!event) return "60";
    const start = new Date(event.startsAt).getTime();
    const end = new Date(event.endsAt).getTime();
    return String(Math.max(15, Math.round((end - start) / 60000)));
  }, [event]);

  const [privateAudienceUserIds, setPrivateAudienceUserIds] = useState<string[]>(
    () => [...new Set(event?.audiences?.map((a) => a.userId) ?? (currentUserId ? [currentUserId] : []))],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    const submitter = (submitEvent.nativeEvent as SubmitEvent).submitter;
    if (submitter?.dataset.serverAction === "true") return;

    submitEvent.preventDefault();
    setIsSaving(true);
    setSaveError("");

    try {
      const response = await fetch(submitEvent.currentTarget.action, {
        method: "POST",
        body: new FormData(submitEvent.currentTarget),
      });
      if (!response.ok) throw new Error("save_failed");
      window.location.assign(response.url);
    } catch {
      setSaveError("No pudimos guardar los cambios. Probá de nuevo.");
      setIsSaving(false);
    }
  }

  return (
    <form action="/api/dashboard/calendar/events/save" method="post" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <div data-slot="calendar-event-body" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold text-slate-900">Información general</legend>
              <label htmlFor={fieldId("title")} className="block text-sm font-medium text-slate-700">Título del evento</label>
              <input id={fieldId("title")} name="title" placeholder="Título del evento" defaultValue={event?.title ?? ""} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required />
              <label htmlFor={fieldId("kind")} className="block text-sm font-medium text-slate-700">Tipo de evento</label>
              <select id={fieldId("kind")} name="kind" defaultValue={event?.kind ?? "EVENT"} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="EVENT">Evento</option>
                <option value="MEETING">Reunión</option>
              </select>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold text-slate-900">Fecha y horario</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor={fieldId("eventDate")} className="block text-sm font-medium text-slate-700">Fecha</label>
                  <input id={fieldId("eventDate")} name="eventDate" type="date" defaultValue={event ? calendarDateValue(new Date(event.startsAt), timeZone) : undefined} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor={fieldId("startTime")} className="block text-sm font-medium text-slate-700">Hora de inicio</label>
                  <input id={fieldId("startTime")} name="startTime" type="time" defaultValue={event ? calendarTimeValue(new Date(event.startsAt), timeZone) : undefined} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required />
                </div>
              </div>
              <p className="text-sm text-slate-700">Todos los horarios son de Ciudad de México (México).</p>
              <label htmlFor={fieldId("durationMinutes")} className="block text-sm font-medium text-slate-700">Duración en minutos</label>
              <input id={fieldId("durationMinutes")} name="durationMinutes" type="number" min="15" step="15" defaultValue={durationDefault} placeholder="Duración en minutos" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required />
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold text-slate-900">Ubicación y descripción</legend>
              <label htmlFor={fieldId("location")} className="block text-sm font-medium text-slate-700">Ubicación</label>
              <input id={fieldId("location")} name="location" placeholder="Ubicación" defaultValue={event?.location ?? ""} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <label htmlFor={fieldId("description")} className="block text-sm font-medium text-slate-700">Descripción del evento</label>
              <textarea id={fieldId("description")} name="description" placeholder="Descripción del evento" defaultValue={event?.description ?? ""} className="min-h-24 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </fieldset>
          </div>
          <div className="min-w-0 space-y-6">
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold text-slate-900">Visibilidad y audiencia</legend>
              <label htmlFor={fieldId("accessScope")} className="block text-sm font-medium text-slate-700">Quién puede verlo</label>
              <select id={fieldId("accessScope")} name="accessScope" value={accessScope} onChange={e => setAccessScope(e.target.value as CalendarAccessScope)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {canManageCalendar || event?.accessScope === "LEGACY" || areas.length === 0 ? <option value="LEGACY">Publicación y audiencias existentes</option> : null}
                {areas.length > 0 ? <>
                  <option value="INTERNAL">Todo el equipo interno</option>
                  <option value="AREAS">Áreas autorizadas</option>
                  <option value="PEOPLE">Personas específicas (restringido)</option>
                </> : null}
              </select>
              {accessScope !== "LEGACY" ? <>
                <input type="hidden" name="visibility" value="MEMBERS" />
                <input type="hidden" name="audienceType" value="PRIVATE" />
                <label htmlFor={fieldId("responsibleAreaId")} className="block text-sm font-medium text-slate-700">Área responsable de la organización y edición</label>
                <select id={fieldId("responsibleAreaId")} name="responsibleAreaId" value={responsibleAreaId} required onChange={e => { setResponsibleAreaId(e.target.value); setInvolvedAreaIds(ids => [...new Set([...ids, e.target.value])]); }} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Seleccioná un área</option>
                  {areas.filter(area => canManageCalendar || editableAreaIds.includes(area.id)).map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
                </select>
                <fieldset className="space-y-2"><legend className="text-sm font-medium">Áreas involucradas</legend>
                  {areas.map(area => <label key={area.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="involvedAreaIds" value={area.id} checked={involvedAreaIds.includes(area.id) || area.id === responsibleAreaId} onChange={() => setInvolvedAreaIds(ids => toggleArea(ids, area.id))} /><span className="size-2 rounded-full" style={{ backgroundColor: area.color }} />{area.name}</label>)}
                </fieldset>
                {accessScope === "AREAS" ? <fieldset className="space-y-2"><legend className="text-sm font-medium">Áreas autorizadas para consultar</legend>
                  {areas.map(area => <label key={area.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="audienceAreaIds" value={area.id} checked={audienceAreaIds.includes(area.id)} onChange={() => setAudienceAreaIds(ids => toggleArea(ids, area.id))} />{area.name}</label>)}
                </fieldset> : null}
                <p className="text-xs text-slate-600">{accessScope === "INTERNAL" ? "Visible para el equipo interno. No se publica para familias ni visitantes." : accessScope === "AREAS" ? "Visible solo para personas con acceso a las áreas autorizadas. Las áreas involucradas no conceden acceso por sí solas." : "Solo las personas seleccionadas podrán verlo, incluso si otras administran el calendario. Incluite para conservar acceso."}</p>
              </> : <>
              <label htmlFor={fieldId("visibility")} className="block text-sm font-medium text-slate-700">Visibilidad</label>
              <select id={fieldId("visibility")} name="visibility" value={visibility} onChange={(e) => {
                const nextVisibility = e.target.value as CalendarEventVisibility;
                setVisibility(nextVisibility);
                if (nextVisibility === "PUBLIC") setAudienceType("ALL");
              }} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {visibilityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {visibility === "PUBLIC" ? <input type="hidden" name="audienceType" value="ALL" /> : (
                <div className="space-y-2">
                  <label htmlFor={fieldId("audienceType")} className="block text-sm font-medium text-slate-700">Audiencia</label>
                  <select id={fieldId("audienceType")} name="audienceType" value={audienceType} onChange={(e) => setAudienceType(e.target.value as CalendarAudienceType)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    {audienceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
              </>}
              {(accessScope === "PEOPLE" || (accessScope === "LEGACY" && visibility !== "PUBLIC" && audienceType === "PRIVATE")) ? (
                <div className="space-y-2">
                  <label htmlFor={fieldId("privateAudienceUserIds")} className="block text-sm font-medium text-slate-700">Personas autorizadas</label>
                  {privateAudienceUserIds.map((id) => <input key={id} type="hidden" name="privateAudienceUserIds" value={id} />)}
                  <CalendarEventGuestPicker
                    triggerId={fieldId("privateAudienceUserIds")}
                    users={users.map((user) => ({ ...user, roleLabel: roleLabel(user.role) }))}
                    selectedIds={privateAudienceUserIds}
                    onChange={setPrivateAudienceUserIds}
                  />
                </div>
              ) : null}
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold text-slate-900">Inscripción y asistencia</legend>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input name="registrationsEnabled" type="checkbox" checked={registrationsEnabled} onChange={(event) => setRegistrationsEnabled(event.target.checked)} />
                Permitir inscripciones
              </label>
              {registrationsEnabled ? <p className="text-xs text-slate-500">{accessScope === "LEGACY" && visibility === "PUBLIC" ? "La inscripción será pública." : "La inscripción será privada para miembros autorizados."}</p> : null}
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input name="attendanceConfirmationEnabled" type="checkbox" checked={attendanceConfirmationEnabled} onChange={(changeEvent) => setAttendanceConfirmationEnabled(changeEvent.target.checked)} />
                Solicitar confirmación de asistencia
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input name="sendEmails" type="checkbox" disabled={!attendanceConfirmationEnabled} />
                Enviar invitaciones por email
              </label>
              <p className="text-xs text-slate-500">
                {attendanceConfirmationEnabled
                  ? "Solo se enviarán emails si marcás esta opción. Se invita a la audiencia seleccionada; el organizador no recibe invitación."
                  : "Activá la confirmación de asistencia para habilitar el envío de invitaciones por email."}
              </p>
              {event?.attendanceConfirmationEnabled ? <CalendarEventAttendanceDialog eventId={event.id} eventDate={calendarDateValue(new Date(event.startsAt), timeZone)} attendances={event.attendances ?? []} error={error} ok={ok} /> : null}
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold text-slate-900">Imagen del evento</legend>
              <CalendarEventImageField defaultValue={event?.imageUrl} />
            </fieldset>
          </div>
        </div>
      </div>
      <div data-slot="calendar-event-footer" className="shrink-0 space-y-2 border-t border-slate-200 bg-background px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div aria-live="polite">
          {ok ? <p className="text-xs text-emerald-700">Guardado: {ok}</p> : null}
          {error ? <p className="text-xs text-rose-700">{saveErrorMessages[error] ?? `Error: ${error}`}</p> : null}
          {saveError ? <p className="text-xs text-rose-700">{saveError}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-3 md:ml-auto md:w-full md:max-w-sm">
          {mode === "edit" && event ? (
            <button type="submit" data-server-action="true" formAction={cancelCalendarEventAction} className="rounded-lg border border-rose-200 py-2 text-sm font-semibold text-rose-700">Cancelar evento</button>
          ) : (
            <ResponsiveDialogClose render={<button type="button" className="rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-700" />}>Cancelar</ResponsiveDialogClose>
          )}
          <button type="submit" disabled={isSaving} className="rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Guardar"}</button>
        </div>
      </div>
    </form>
  );
}
