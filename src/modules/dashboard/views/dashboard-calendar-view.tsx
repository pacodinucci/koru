import {
  CalendarAudienceType,
  CalendarEventStatus,
  UserRole,
} from "@prisma/client";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import {
  cancelCalendarEventAction,
  saveCalendarEventAction,
} from "@/modules/dashboard/server/calendar.actions";

type Props = {
  events: Array<{
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
    audienceType: CalendarAudienceType;
    status: CalendarEventStatus;
    kind: "EVENT" | "MEETING";
  }>;
  users: Array<{ id: string; name: string; role: UserRole }>;
  ok?: string;
  error?: string;
};

const audienceOptions: CalendarAudienceType[] = [
  "ALL",
  "TEACHERS",
  "PARENTS",
  "PRIVATE",
];
const statusOptions: CalendarEventStatus[] = ["DRAFT", "PUBLISHED", "CANCELED"];
const weekHeader = ["LUN 11", "MAR 12", "MIÉ 13", "JUE 14"];
const hours = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM"];

function formatRange(start: Date, end: Date) {
  return `${start.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString(
    "es-AR",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

const cardPalette = [
  "bg-pink-100 border-pink-200",
  "bg-sky-100 border-sky-200",
  "bg-violet-100 border-violet-200",
  "bg-emerald-100 border-emerald-200",
];

export function DashboardCalendarGrid({ events }: Pick<Props, "events">) {
  const preview = events.slice(0, 8);

  return (
    <section className="overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <p className="text-lg leading-none font-semibold text-slate-900">
            Marzo 2024
          </p>
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700"
          >
            Hoy
          </button>
          <button type="button" className="rounded-md p-1.5 text-slate-500">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-md p-1.5 text-slate-500">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-800"
          >
            Filtros
          </button>
        </div>
        <div className="rounded-xl border border-slate-200 p-1">
          <button className="px-3 py-1 text-sm text-slate-500">Día</button>
          <button className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-900">
            Semana
          </button>
          <button className="px-3 py-1 text-sm text-slate-500">Mes</button>
        </div>
      </div>

      <div className="grid grid-cols-[75px_repeat(4,minmax(0,1fr))]">
        <div className="border-r border-b border-slate-200 p-3 text-xs font-medium text-slate-400">
          GMT+3
        </div>
        {weekHeader.map((label, i) => (
          <div
            key={label}
            className="border-r border-b border-slate-200 p-2.5 text-center text-xs font-semibold text-slate-500"
          >
            {label.split(" ")[0]}
            <div
              className={`mx-auto mt-1.5 w-fit rounded-full px-2.5 py-1 text-xs ${i === 0 ? "bg-emerald-600 text-white" : "text-slate-900"}`}
            >
              {label.split(" ")[1]}
            </div>
          </div>
        ))}
        {hours.map((hour, row) => (
          <div key={hour} className="contents">
            <div className="border-r border-b border-slate-200 p-2.5 text-xs text-slate-500">
              {hour}
            </div>
            {weekHeader.map((day, col) => {
              const e = preview[row * weekHeader.length + col];
              return (
                <div
                  key={`${day}-${hour}`}
                  className="min-h-24 border-r border-b border-slate-100 p-1.5"
                >
                  {e ? (
                    <div
                      className={`rounded-lg border p-2 ${cardPalette[(row + col) % cardPalette.length]}`}
                    >
                      <p className="text-[11px] font-semibold">
                        {formatRange(new Date(e.startsAt), new Date(e.endsAt))}
                      </p>
                      <p className="mt-1.5 text-[11px] font-semibold leading-tight">
                        {e.title}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardCalendarTopBar() {
  return (
    <div className="flex items-center justify-between bg-white px-4 py-2.5">
      <h1 className="text-xl leading-none font-semibold text-slate-900">
        Calendario
      </h1>
      <button
        type="button"
        className="inline-flex items-center gap-2 bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white"
      >
        <Plus className="h-4 w-4" />
        Crear evento
      </button>
    </div>
  );
}

export function DashboardCalendarSidePanel({
  events,
  users,
  ok,
  error,
}: Props) {
  const first = events[0];

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <ChevronLeft className="h-4 w-4 text-slate-500" />
          <p className="text-base font-semibold text-slate-900">Marzo 2024</p>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
          {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
            <span key={d} className="font-medium text-slate-500">
              {d}
            </span>
          ))}
          {Array.from({ length: 31 }).map((_, i) => (
            <span
              key={i}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs ${i + 1 === 11 ? "bg-emerald-600 text-white" : "text-slate-800"}`}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-xs text-slate-500">Evento en vivo</p>
        <p className="text-lg font-semibold text-slate-900">
          Reunión con Andrew Paul
        </p>
        <form action={saveCalendarEventAction} className="mt-3 space-y-2">
          <input
            name="title"
            placeholder="Título del evento"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
          <input
            name="startsAt"
            type="datetime-local"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
          <input
            name="endsAt"
            type="datetime-local"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
          <select
            name="audienceType"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {audienceOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue="PUBLISHED"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {statusOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select
            name="kind"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="EVENT">EVENT</option>
            <option value="MEETING">MEETING</option>
          </select>
          <select
            name="privateAudienceUserIds"
            multiple
            className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} - {u.role}
              </option>
            ))}
          </select>
          {ok ? (
            <p className="text-xs text-emerald-700">Guardado: {ok}</p>
          ) : null}
          {error ? (
            <p className="text-xs text-rose-700">Error: {error}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white"
            >
              Guardar
            </button>
          </div>
        </form>
        {first ? (
          <form action={cancelCalendarEventAction} className="mt-2">
            <input type="hidden" name="id" value={first.id} />
            <button
              type="submit"
              className="w-full text-xs font-semibold text-rose-700"
            >
              Cancelar primer evento
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
