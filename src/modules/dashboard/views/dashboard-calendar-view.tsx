import { CalendarAudienceType, UserRole } from "@prisma/client";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import { CalendarEventForm } from "@/modules/dashboard/components/calendar-event-form";
import { ResponsiveEventSheet } from "@/modules/dashboard/components/responsive-event-sheet";

type CalendarEventItem = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  audienceType: CalendarAudienceType;
  status: string;
  kind: "EVENT" | "MEETING";
  audiences?: Array<{ userId: string }>;
};

type Props = {
  events: CalendarEventItem[];
  users: Array<{ id: string; name: string; role: UserRole }>;
  ok?: string;
  error?: string;
  dateCursor: Date;
  viewMode: "day" | "week" | "month";
  selectedEventId?: string;
};

const WEEK_DAYS = ["Lun", "Mar", "Mi\u00e9", "Jue", "Vie", "S\u00e1b", "Dom"];

function toDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatRange(start: Date, end: Date) {
  return `${start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function getStartOfWeek(baseDate: Date) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offsetToMonday);
  return toDateOnly(d);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getVisibleDays(cursor: Date, viewMode: Props["viewMode"]) {
  if (viewMode === "day") return [toDateOnly(cursor)];
  if (viewMode === "week") {
    const start = getStartOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  return Array.from({ length: last.getDate() }, (_, i) => addDays(first, i));
}

function getHourRows() {
  return Array.from({ length: 10 }, (_, i) => `${9 + i}:00`);
}

function hrefWith(dateCursor: Date, viewMode: Props["viewMode"], editId?: string) {
  const params = new URLSearchParams();
  params.set("date", toDateOnly(dateCursor).toISOString().slice(0, 10));
  params.set("view", viewMode);
  if (editId) params.set("edit", editId);
  return `/dashboard/calendar?${params.toString()}`;
}

function moveCursor(cursor: Date, viewMode: Props["viewMode"], direction: -1 | 1) {
  const unit = viewMode === "day" ? 1 : viewMode === "week" ? 7 : 30;
  return addDays(cursor, direction * unit);
}

function formatHeaderLabel(dateCursor: Date, viewMode: Props["viewMode"]) {
  if (viewMode === "month") {
    return dateCursor.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  }

  if (viewMode === "day") {
    return dateCursor.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const start = getStartOfWeek(dateCursor);
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  if (sameMonth) {
    return `${start.getDate()} al ${end.getDate()} ${start.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}`;
  }
  return `${start.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} al ${end.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}`;
}

const cardPalette = ["bg-pink-100 border-pink-200", "bg-sky-100 border-sky-200", "bg-violet-100 border-violet-200", "bg-emerald-100 border-emerald-200"];

function CalendarViewSwitch({ dateCursor, viewMode }: Pick<Props, "dateCursor" | "viewMode">) {
  return (
    <div className="rounded-xl border border-slate-200 p-1">
      <Link className={`px-3 py-1 text-sm ${viewMode === "day" ? "rounded-lg bg-slate-100 font-semibold text-slate-900" : "text-slate-500"}`} href={hrefWith(dateCursor, "day")}>{"D\u00eda"}</Link>
      <Link className={`px-3 py-1 text-sm ${viewMode === "week" ? "rounded-lg bg-slate-100 font-semibold text-slate-900" : "text-slate-500"}`} href={hrefWith(dateCursor, "week")}>Semana</Link>
      <Link className={`px-3 py-1 text-sm ${viewMode === "month" ? "rounded-lg bg-slate-100 font-semibold text-slate-900" : "text-slate-500"}`} href={hrefWith(dateCursor, "month")}>Mes</Link>
    </div>
  );
}

export function DashboardCalendarGrid({ events, dateCursor, viewMode, selectedEventId }: Pick<Props, "events" | "dateCursor" | "viewMode" | "selectedEventId">) {
  const now = new Date();
  const visibleDays = getVisibleDays(dateCursor, viewMode);
  const headerLabel = formatHeaderLabel(dateCursor, viewMode);
  const hours = getHourRows();

  return (
    <section className="overflow-hidden bg-white [font-family:var(--font-montserrat)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <p className="text-lg leading-none font-semibold text-slate-900 capitalize">{headerLabel}</p>
          <Link href={hrefWith(new Date(), viewMode)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700">Hoy</Link>
          <Link href={hrefWith(moveCursor(dateCursor, viewMode, -1), viewMode)} className="rounded-md p-1.5 text-slate-500"><ChevronLeft className="h-4 w-4" /></Link>
          <Link href={hrefWith(moveCursor(dateCursor, viewMode, 1), viewMode)} className="rounded-md p-1.5 text-slate-500"><ChevronRight className="h-4 w-4" /></Link>
        </div>
        <CalendarViewSwitch dateCursor={dateCursor} viewMode={viewMode} />
      </div>

      {viewMode === "month" ? (
        <div className="grid grid-cols-7">
          {WEEK_DAYS.map((d) => <div key={d} className="border-r border-b border-slate-200 p-2 text-center text-xs font-semibold text-slate-500">{d.toUpperCase()}</div>)}
          {Array.from({ length: (new Date(dateCursor.getFullYear(), dateCursor.getMonth(), 1).getDay() + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} className="min-h-24 border-r border-b border-slate-100 p-2" />)}
          {visibleDays.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(new Date(e.startsAt), day));
            return (
              <div key={day.toISOString()} className="min-h-24 border-r border-b border-slate-100 p-2">
                <p className="text-xs font-semibold text-slate-900">{day.getDate()}</p>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map((event, i) => (
                    <Link key={event.id} href={hrefWith(dateCursor, viewMode, event.id)} className={`block rounded border px-1 py-0.5 text-[11px] ${cardPalette[i % cardPalette.length]} ${selectedEventId === event.id ? "ring-2 ring-emerald-500" : ""}`}>
                      {event.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: `75px repeat(${visibleDays.length}, minmax(0, 1fr))` }}>
          <div className="border-r border-b border-slate-200 p-3 text-xs font-medium text-slate-400">UTC{Intl.DateTimeFormat("en", { timeZoneName: "shortOffset" }).format(now).replace(/.*GMT/, "")}</div>
          {visibleDays.map((day, i) => (
            <div key={day.toISOString()} className="border-r border-b border-slate-200 p-2.5 text-center text-xs font-semibold text-slate-500">
              {day.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", "").toUpperCase()}
              <div className={`mx-auto mt-1.5 w-fit rounded-full px-2.5 py-1 text-xs ${i === 0 ? "bg-emerald-600 text-white" : "text-slate-900"}`}>{day.getDate()}</div>
            </div>
          ))}
          {hours.map((hour, row) => (
            <div key={hour} className="contents">
              <div className="border-r border-b border-slate-200 p-2.5 text-xs text-slate-500">{hour}</div>
              {visibleDays.map((day, col) => {
                const cellEvents = events.filter((event) => {
                  const startsAt = new Date(event.startsAt);
                  return isSameDay(startsAt, day) && startsAt.getHours() === Number(hour.split(":")[0]);
                });
                return (
                  <div key={`${day.toISOString()}-${hour}`} className="min-h-24 border-r border-b border-slate-100 p-1.5">
                    {cellEvents.map((event, idx) => (
                      <Link key={event.id} href={hrefWith(dateCursor, viewMode, event.id)} className={`mb-1 block rounded-lg border p-2 ${cardPalette[(row + col + idx) % cardPalette.length]} ${selectedEventId === event.id ? "ring-2 ring-emerald-500" : ""}`}>
                        <p className="text-[11px] font-semibold">{formatRange(new Date(event.startsAt), new Date(event.endsAt))}</p>
                        <p className="mt-1.5 text-[11px] font-semibold leading-tight">{event.title}</p>
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function DashboardCalendarTopBar({ users, ok, error, selectedEventId, events, dateCursor, viewMode }: Pick<Props, "users" | "ok" | "error" | "selectedEventId" | "events" | "dateCursor" | "viewMode">) {
  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const closeHref = hrefWith(dateCursor, viewMode);

  return (
    <div className="flex items-center justify-between bg-white px-4 py-2.5 [font-family:var(--font-montserrat)]">
      <h1 className="text-xl leading-none font-semibold text-slate-900">Calendario</h1>

      <div className="flex items-center gap-2">
        <ResponsiveEventSheet
          title="Crear evento"
          description="Completa los datos del evento"
          trigger={<span className="inline-flex items-center gap-2 bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white"><Plus className="h-4 w-4" />Crear evento</span>}
        >
          <CalendarEventForm users={users} ok={ok} error={error} mode="create" />
        </ResponsiveEventSheet>

        {selectedEvent ? (
          <ResponsiveEventSheet
            title="Editar evento"
            description="Actualiza los datos del evento"
            openOnMount
            closeHref={closeHref}
          >
            <CalendarEventForm users={users} ok={ok} error={error} event={selectedEvent} mode="edit" />
          </ResponsiveEventSheet>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardCalendarSidePanel({ events, dateCursor, viewMode }: Pick<Props, "events" | "dateCursor" | "viewMode">) {
  const headerLabel = dateCursor.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const today = new Date();
  const days = getVisibleDays(dateCursor, "month");
  const leading = Array.from({ length: (new Date(dateCursor.getFullYear(), dateCursor.getMonth(), 1).getDay() + 6) % 7 }, () => null);

  const upcomingEvents = events
    .filter((event) => new Date(event.startsAt).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-4 p-4 [font-family:var(--font-montserrat)]">
      <div className="rounded-xl py-4">
        <div className="mb-2 flex items-center justify-between">
          <Link href={hrefWith(addDays(dateCursor, -30), "month")} className="text-slate-500"><ChevronLeft className="h-4 w-4" /></Link>
          <p className="text-base font-semibold text-slate-900 capitalize">{headerLabel}</p>
          <Link href={hrefWith(addDays(dateCursor, 30), "month")} className="text-slate-500"><ChevronRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
          {WEEK_DAYS.map((d) => <span key={d} className="font-medium text-slate-500">{d.slice(0, 2)}</span>)}
          {leading.map((_, i) => <span key={`empty-${i}`} />)}
          {days.map((day, i) => (
            <span key={i} className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs ${isSameDay(day, today) ? "bg-emerald-600 text-white" : "text-slate-800"}`}>{day.getDate()}</span>
          ))}
        </div>
      </div>

      <div className="rounded-xl py-4">
        <p className="text-xs text-slate-500">Pr?ximos eventos</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
          <div className="grid grid-cols-[88px_96px_1fr] border-b border-slate-200 bg-slate-50 px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <span>Fecha</span>
            <span>Hora</span>
            <span>Evento</span>
          </div>
          {upcomingEvents.length ? upcomingEvents.map((event) => (
            <Link key={event.id} href={hrefWith(dateCursor, viewMode, event.id)} className="grid grid-cols-[88px_96px_1fr] items-center border-b border-slate-100 px-2 py-2 text-xs hover:bg-slate-50 last:border-b-0">
              <span className="text-slate-600">{new Date(event.startsAt).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })}</span>
              <span className="text-slate-600">{formatRange(new Date(event.startsAt), new Date(event.endsAt)).split(" - ")[0]}</span>
              <span className="truncate font-semibold text-slate-900">{event.title}</span>
            </Link>
          )) : <p className="px-2 py-3 text-sm text-slate-500">No hay pr?ximos eventos.</p>}
        </div>
      </div>
    </div>
  );
}
