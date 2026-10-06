"use client";

import { useMemo, useState, type FormEvent } from "react";
import type {
  CalendarAudienceType,
  CalendarEventVisibility,
  UserRole,
} from "@prisma/client";

import { CalendarEventImageField } from "@/modules/dashboard/components/calendar-event-image-field";
import { CalendarEventAttendanceDialog } from "@/modules/dashboard/components/calendar-event-attendance-dialog";
import {
  CALENDAR_TIME_ZONES,
  DEFAULT_CALENDAR_TIME_ZONE,
  calendarDateValue,
  calendarTimeValue,
} from "@/modules/calendar/lib/calendar-time-zone";

import {
  cancelCalendarEventAction,
} from "@/modules/dashboard/server/calendar.actions";

type EventItem = {
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

type Props = {
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
  invalid_date: "La fecha u hora no existe en la zona horaria seleccionada.",
  ambiguous_date: "Esa hora ocurre dos veces por el cambio de horario. Elegí otra hora.",
  invalid_time_zone: "Seleccioná una zona horaria válida.",
};

function roleLabel(role: UserRole) {
  if (role === "SUPERADMIN") return "Superadmin";
  if (role === "ADMIN_OPERATOR") return "Admin operador";
  if (role === "ADMIN_TEACHER") return "Admin docente";
  if (role === "ADMIN") return "Administrador";
  if (role === "TEACHER") return "Maestro";
  return "Familia";
}

export function CalendarEventForm({ users, ok, error, event, mode = "create" }: Props) {
  const timeZone = event?.timeZone ?? DEFAULT_CALENDAR_TIME_ZONE;
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

  const privateDefaults = new Set(event?.audiences?.map((a) => a.userId) ?? []);
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
    <form action="/api/dashboard/calendar/events/save" method="post" onSubmit={handleSubmit} className="mt-3 space-y-2">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}

      <input
        name="title"
        placeholder="Título del evento"
        defaultValue={event?.title ?? ""}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        required
      />
      <input
        name="eventDate"
        type="date"
        defaultValue={event ? calendarDateValue(new Date(event.startsAt), timeZone) : undefined}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        required
      />
      <input
        name="startTime"
        type="time"
        defaultValue={event ? calendarTimeValue(new Date(event.startsAt), timeZone) : undefined}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        required
      />
      <label className="block text-sm text-slate-700">
        Zona horaria del evento
        <select
          name="timeZone"
          defaultValue={timeZone}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          required
        >
          {CALENDAR_TIME_ZONES.map((zone) => (
            <option key={zone.value} value={zone.value}>{zone.label}</option>
          ))}
        </select>
      </label>
      <input
        name="durationMinutes"
        type="number"
        min="15"
        step="15"
        defaultValue={durationDefault}
        placeholder="Duración en minutos"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        required
      />
      <input
        name="location"
        placeholder="Ubicación"
        defaultValue={event?.location ?? ""}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />      <textarea
        name="description"
        placeholder="Descripción del evento"
        defaultValue={event?.description ?? ""}
        className="min-h-24 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <CalendarEventImageField defaultValue={event?.imageUrl} />
      <select
        name="visibility"
        value={visibility}
        onChange={(e) => {
          const nextVisibility = e.target.value as CalendarEventVisibility;
          setVisibility(nextVisibility);
          if (nextVisibility === "PUBLIC") {
            setAudienceType("ALL");
          }
        }}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        {visibilityOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {visibility === "PUBLIC" ? (
        <input type="hidden" name="audienceType" value="ALL" />
      ) : (
        <select
          name="audienceType"
          value={audienceType}
          onChange={(e) => setAudienceType(e.target.value as CalendarAudienceType)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {audienceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      <select name="kind" defaultValue={event?.kind ?? "EVENT"} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="EVENT">Evento</option>
        <option value="MEETING">Reunión</option>
      </select>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          name="registrationsEnabled"
          type="checkbox"
          checked={registrationsEnabled}
          onChange={(event) => setRegistrationsEnabled(event.target.checked)}
        />
        Permitir inscripciones
      </label>
      {registrationsEnabled ? (
        <p className="text-xs text-slate-500">
          {visibility === "PUBLIC"
            ? "La inscripción será pública."
            : "La inscripción será privada para miembros autorizados."}
        </p>
      ) : null}

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          name="attendanceConfirmationEnabled"
          type="checkbox"
          checked={attendanceConfirmationEnabled}
          onChange={(changeEvent) => setAttendanceConfirmationEnabled(changeEvent.target.checked)}
        />
        Solicitar confirmación de asistencia
      </label>
      {attendanceConfirmationEnabled ? (
        <p className="text-xs text-slate-500">
          Al guardar se invitará por email a la audiencia seleccionada. El organizador no recibe invitación.
        </p>
      ) : null}


      {visibility !== "PUBLIC" && audienceType === "PRIVATE" ? (
        <select
          name="privateAudienceUserIds"
          multiple
          defaultValue={[...privateDefaults]}
          className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} - {roleLabel(u.role)}
            </option>
          ))}
        </select>
      ) : null}

      {event?.attendanceConfirmationEnabled ? (
        <CalendarEventAttendanceDialog
          eventId={event.id}
          eventDate={calendarDateValue(new Date(event.startsAt), timeZone)}
          attendances={event.attendances ?? []}
          error={error}
          ok={ok}
        />
      ) : null}

      {ok ? <p className="text-xs text-emerald-700">Guardado: {ok}</p> : null}
      {error ? <p className="text-xs text-rose-700">{saveErrorMessages[error] ?? `Error: ${error}`}</p> : null}
      {saveError ? <p className="text-xs text-rose-700">{saveError}</p> : null}

      <div className="grid grid-cols-2 gap-2">
        {mode === "edit" && event ? (
          <button
            type="submit"
            data-server-action="true"
            formAction={cancelCalendarEventAction}
            className="rounded-lg border border-rose-200 py-2 text-sm font-semibold text-rose-700"
          >
            Cancelar evento
          </button>
        ) : (
          <button type="button" className="rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-700">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={isSaving} className="rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
