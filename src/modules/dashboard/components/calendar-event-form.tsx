"use client";

import { useMemo, useState } from "react";
import { CalendarAudienceType, UserRole } from "@prisma/client";

import {
  cancelCalendarEventAction,
  saveCalendarEventAction,
} from "@/modules/dashboard/server/calendar.actions";

type EventItem = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  audienceType: CalendarAudienceType;
  kind: "EVENT" | "MEETING";
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

function roleLabel(role: UserRole) {
  if (role === "ADMIN") return "Administrador";
  if (role === "TEACHER") return "Maestro";
  return "Padre";
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
  const initialAudience = event?.audienceType ?? "ALL";
  const [audienceType, setAudienceType] = useState<CalendarAudienceType>(initialAudience);

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
        placeholder="T\u00edtulo del evento"
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
        placeholder="Duraci\u00f3n en minutos"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        required
      />
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
      <select name="kind" defaultValue={event?.kind ?? "EVENT"} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="EVENT">Evento</option>
        <option value="MEETING">Reuni\u00f3n</option>
      </select>

      {audienceType === "PRIVATE" ? (
        <select name="privateAudienceUserIds" multiple className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          {users.map((u) => (
            <option key={u.id} value={u.id} defaultChecked={privateDefaults.has(u.id)}>
              {u.name} - {roleLabel(u.role)}
            </option>
          ))}
        </select>
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
