import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { calendarTimeZoneLabel } from "@/modules/calendar/lib/calendar-time-zone";

import { respondToExternalCalendarInvitationAction } from "@/modules/calendar/server/calendar-attendance.actions";
import { getExternalCalendarInvitationByToken } from "@/modules/calendar/server/calendar-external-invitation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
};

export default async function ExternalCalendarInvitationPage({ params, searchParams }: Props) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const attendance = await getExternalCalendarInvitationByToken(token);
  if (!attendance) notFound();

  const { event } = attendance;
  return (
    <main className="mx-auto min-h-[calc(100svh-8rem)] w-full max-w-2xl px-6 py-12 [font-family:var(--font-montserrat)]">
      <p className="text-sm font-semibold text-[var(--complement-800)]">Koru · Invitación personal</p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-900">{event.title}</h1>
      <p className="mt-4 text-sm text-slate-600">
        {event.startsAt.toLocaleDateString("es-AR", { timeZone: event.timeZone, day: "numeric", month: "long", year: "numeric" })}
        {" · "}
        {event.startsAt.toLocaleTimeString("es-AR", { timeZone: event.timeZone, hour: "2-digit", minute: "2-digit" })}
        {" - "}
        {event.endsAt.toLocaleTimeString("es-AR", { timeZone: event.timeZone, hour: "2-digit", minute: "2-digit" })}
        {` (${calendarTimeZoneLabel(event.timeZone)})`}
        {event.location ? ` · ${event.location}` : ""}
      </p>
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Tu asistencia</h2>
        <p className="mt-2 text-sm text-slate-600">Invitación para {attendance.name} ({attendance.email})</p>
        <p className="mt-4 text-sm font-medium text-slate-800">
          {attendance.status === "CONFIRMED" ? "Confirmaste tu asistencia." : attendance.status === "DECLINED" ? "Avisaste que no podrás asistir." : "Todavía no respondiste."}
        </p>
        {query.ok === "attendance_updated" ? <p className="mt-2 text-sm text-emerald-700">Tu respuesta quedó guardada.</p> : null}
        {query.error ? <p className="mt-2 text-sm text-rose-700">No pudimos guardar tu respuesta.</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={respondToExternalCalendarInvitationAction}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="status" value="CONFIRMED" />
            <button type="submit" className="rounded-lg bg-[var(--complement-800)] px-5 py-2.5 text-sm font-semibold text-white">Confirmar asistencia</button>
          </form>
          <form action={respondToExternalCalendarInvitationAction}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="status" value="DECLINED" />
            <button type="submit" className="rounded-lg border border-[var(--complement-800)] px-5 py-2.5 text-sm font-semibold text-[var(--complement-900)]">No podré asistir</button>
          </form>
        </div>
      </section>
    </main>
  );
}
