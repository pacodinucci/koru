"use client";

import { useMemo, useState } from "react";
import type {
  CalendarAudienceType,
  CalendarEventVisibility,
  UserRole,
} from "@prisma/client";

import { CalendarEventImageField } from "@/modules/dashboard/components/calendar-event-image-field";

import {
  cancelCalendarEventAction,
  retryCalendarEventInvitationsAction,
  saveCalendarEventAction,
} from "@/modules/dashboard/server/calendar.actions";

type EventItem = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
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
    name: string;
    email: string;
    status: "PENDING" | "CONFIRMED" | "DECLINED";
    invitationSentAt?: Date | string | null;
    invitationError?: string | null;
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

function roleLabel(role: UserRole) {
  if (role === "SUPERADMIN") return "Superadmin";
  if (role === "ADMIN_TEACHER") return "Admin docente";
  if (role === "ADMIN") return "Administrador";
  if (role === "TEACHER") return "Maestro";
  return "Familia";
}

function toDateValue(date: Date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toTimeValue(date: Date) {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function CalendarEventForm({ users, ok, error, event, mode = "create" }: Props) {
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

  return (
    <form action={saveCalendarEventAction} className="mt-3 space-y-2">
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
        defaultValue={event ? toDateValue(new Date(event.startsAt)) : undefined}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        required
      />
      <input
        name="startTime"
        type="time"
        defaultValue={event ? toTimeValue(new Date(event.startsAt)) : undefined}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        required
      />
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
        <select name="privateAudienceUserIds" multiple className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          {users.map((u) => (
            <option key={u.id} value={u.id} defaultChecked={privateDefaults.has(u.id)}>
              {u.name} - {roleLabel(u.role)}
            </option>
          ))}
        </select>
      ) : null}

      {event?.attendanceConfirmationEnabled ? (
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800">Asistencia</p>
            <span className="text-xs text-slate-500">{event.attendances?.length ?? 0} invitados</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">{event.attendances?.filter((item) => item.status === "PENDING").length ?? 0} pendientes</span>
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">{event.attendances?.filter((item) => item.status === "CONFIRMED").length ?? 0} confirmados</span>
            <span className="rounded-md bg-rose-50 px-2 py-1 text-rose-700">{event.attendances?.filter((item) => item.status === "DECLINED").length ?? 0} no asisten</span>
          </div>
          {event.attendances?.length ? (
            <ul className="mt-3 max-h-36 space-y-1 overflow-y-auto pr-1 text-xs">
              {event.attendances.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded bg-white px-2 py-1.5">
                  <span className="min-w-0 truncate text-slate-700">{item.name} · {item.email}</span>
                  <span className="shrink-0 font-semibold text-slate-500">
                    {item.status === "CONFIRMED" ? "Confirmado" : item.status === "DECLINED" ? "No asiste" : "Pendiente"}
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-xs text-slate-500">No se encontraron destinatarios para esta audiencia.</p>}
          {event.attendances?.some((item) => !item.invitationSentAt) ? (
            <button
              type="submit"
              formAction={retryCalendarEventInvitationsAction}
              className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Reintentar emails pendientes
            </button>
          ) : null}
        </section>
      ) : null}

      {ok ? <p className="text-xs text-emerald-700">Guardado: {ok}</p> : null}
      {error ? <p className="text-xs text-rose-700">Error: {error}</p> : null}

      <div className="grid grid-cols-2 gap-2">
        {mode === "edit" && event ? (
          <button
            type="submit"
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
        <button type="submit" className="rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white">
          {mode === "edit" ? "Guardar cambios" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
