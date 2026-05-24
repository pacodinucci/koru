import { CalendarAudienceType, CalendarEventStatus, UserRole } from "@prisma/client";

import {
  cancelCalendarEventAction,
  saveCalendarEventAction,
} from "@/modules/dashboard/server/calendar.actions";

type DashboardCalendarViewProps = {
  events: Array<{
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
    audienceType: CalendarAudienceType;
    status: CalendarEventStatus;
    kind: "EVENT" | "MEETING";
    location: string | null;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
  }>;
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

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const dayHours = ["8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

function formatHourRange(start: Date, end: Date) {
  return `${start.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function audienceBadgeClass(audience: CalendarAudienceType) {
  if (audience === "PRIVATE") return "bg-violet-100 text-violet-700";
  if (audience === "TEACHERS") return "bg-sky-100 text-sky-700";
  if (audience === "PARENTS") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700";
}

export function DashboardCalendarView({
  events,
  users,
  ok,
  error,
}: DashboardCalendarViewProps) {
  const previewEvents = events.slice(0, 10);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Calendar</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Compartir
            </button>
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            >
              + Crear evento
            </button>
          </div>
        </header>

        <div className="grid gap-0 lg:grid-cols-[1fr_330px]">
          <div className="border-r border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold text-slate-900">Marzo 2024</h2>
                <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
                  Hoy
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
                  Filtros
                </button>
                <div className="rounded-lg border border-slate-200 p-1">
                  <button className="rounded-md px-3 py-1 text-sm text-slate-500">Día</button>
                  <button className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white">
                    Semana
                  </button>
                  <button className="rounded-md px-3 py-1 text-sm text-slate-500">Mes</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
              <div className="border-b border-r border-slate-200 bg-slate-50 p-3 text-xs text-slate-400">
                GMT-3
              </div>
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className="border-b border-r border-slate-200 bg-slate-50 p-3 text-center text-sm font-semibold text-slate-500"
                >
                  {day} {index + 11}
                </div>
              ))}

              {dayHours.map((hour) => (
                <div key={hour} className="contents">
                  <div className="border-r border-b border-slate-200 p-2 text-center text-xs text-slate-500">
                    {hour}
                  </div>
                  {weekDays.map((day) => (
                    <div key={`${day}-${hour}`} className="h-20 border-r border-b border-slate-100" />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4 p-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-center text-lg font-semibold text-slate-900">Marzo 2024</h3>
              <div className="mt-4 grid grid-cols-7 gap-2 text-center text-sm">
                {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
                  <span key={day} className="font-medium text-slate-400">
                    {day}
                  </span>
                ))}
                {Array.from({ length: 31 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`rounded-full py-1 text-sm ${idx + 1 === 11 ? "bg-indigo-600 text-white" : "text-slate-700"}`}
                  >
                    {idx + 1}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Nuevo evento</h3>
              <form action={saveCalendarEventAction} className="mt-3 space-y-2">
                <input
                  name="title"
                  placeholder="Título"
                  className="w-full rounded-md border border-slate-200 p-2 text-sm"
                  required
                />
                <input
                  name="startsAt"
                  type="datetime-local"
                  className="w-full rounded-md border border-slate-200 p-2 text-sm"
                  required
                />
                <input
                  name="endsAt"
                  type="datetime-local"
                  className="w-full rounded-md border border-slate-200 p-2 text-sm"
                  required
                />
                <select name="audienceType" className="w-full rounded-md border border-slate-200 p-2 text-sm">
                  {audienceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  name="status"
                  className="w-full rounded-md border border-slate-200 p-2 text-sm"
                  defaultValue="PUBLISHED"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select name="kind" className="w-full rounded-md border border-slate-200 p-2 text-sm">
                  <option value="EVENT">EVENT</option>
                  <option value="MEETING">MEETING</option>
                </select>
                <select
                  name="privateAudienceUserIds"
                  multiple
                  className="h-24 w-full rounded-md border border-slate-200 p-2 text-sm"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.role}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Guardar
                </button>
              </form>
            </div>
          </aside>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Eventos activos</h2>
        {ok ? <p className="mt-2 text-sm text-emerald-700">Guardado: {ok}</p> : null}
        {error ? <p className="mt-2 text-sm text-rose-700">Error: {error}</p> : null}
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {previewEvents.map((event) => (
            <div key={event.id} className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-500">
                {formatHourRange(new Date(event.startsAt), new Date(event.endsAt))}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{event.title}</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${audienceBadgeClass(event.audienceType)}`}
                >
                  {event.audienceType}
                </span>
                <span className="text-xs text-slate-500">{event.status}</span>
              </div>
              {event.status !== "CANCELED" ? (
                <form action={cancelCalendarEventAction} className="mt-3">
                  <input type="hidden" name="id" value={event.id} />
                  <button type="submit" className="text-xs font-semibold text-rose-700">
                    Cancelar
                  </button>
                </form>
              ) : null}
            </div>
          ))}
          {previewEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No hay eventos todavía.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
