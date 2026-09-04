import { CalendarDays } from "lucide-react";
import Link from "next/link";

import type { FamilyCalendarEventItem } from "@/modules/family-dashboard/lib/family-calendar-event";

function formatEventDate(value: Date | string) {
  return new Date(value).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

function formatEventTime(event: FamilyCalendarEventItem) {
  if (event.allDay) return "Todo el día";
  return new Date(event.startsAt).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FamilyUpcomingEvents({
  events,
}: {
  events: FamilyCalendarEventItem[];
}) {
  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-[var(--brand-600)]" />
          <h2 className="text-base font-semibold text-slate-900">Próximos eventos</h2>
        </div>
        <Link
          href="/family-dashboard/calendario"
          className="text-sm font-medium text-[var(--brand-600)] hover:text-[var(--brand-700)]"
        >
          Ver calendario
        </Link>
      </div>
      {events.length ? (
        <ul>
          {events.map((event) => (
            <li key={event.id} className="border-b border-slate-100 last:border-b-0">
              <Link
                href={`/family-dashboard/calendario?event=${event.id}`}
                className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 px-4 py-3 hover:bg-slate-50"
              >
                <div className="text-xs text-slate-500">
                  <p className="font-medium text-slate-700">{formatEventDate(event.startsAt)}</p>
                  <p>{formatEventTime(event)}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{event.title}</p>
                  {event.location ? <p className="truncate text-xs text-slate-500">{event.location}</p> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-sm text-slate-500">No hay próximos eventos.</p>
      )}
    </section>
  );
}