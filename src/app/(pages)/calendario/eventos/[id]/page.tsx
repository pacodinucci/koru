import { CalendarAttendanceStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { respondToCalendarEventAction } from "@/modules/calendar/server/calendar-attendance.actions";
import { getCalendarAttendanceForUser } from "@/modules/calendar/server/calendar-attendance.repository";
import { registerForCalendarEventAction } from "@/modules/calendar/server/calendar-registration.actions";
import {
  calendarEventRequiresAuthentication,
  getCalendarEventForViewer,
} from "@/modules/calendar/server/calendar-registration.repository";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
};

const errors: Record<string, string> = {
  already_registered: "Ya estás inscripto/a en este evento.",
  attendance_not_found: "No encontramos una invitación asociada a tu usuario.",
  invalid_attendance_status: "La respuesta seleccionada no es válida.",
  members_only: "La inscripción es sólo para miembros.",
  missing_registration_data: "Completá nombre, email y teléfono.",
  registrations_disabled: "Este evento no acepta inscripciones.",
};

const attendanceLabels: Record<CalendarAttendanceStatus, string> = {
  PENDING: "Todavía no respondiste.",
  CONFIRMED: "Confirmaste tu asistencia.",
  DECLINED: "Avisaste que no podrás asistir.",
};

export default async function CalendarEventPage({ params, searchParams }: Props) {
  const [{ id }, query, user] = await Promise.all([
    params,
    searchParams,
    getAuthenticatedUser(),
  ]);
  const viewer = user ? { id: user.id, role: user.role } : undefined;
  const event = await getCalendarEventForViewer(id, viewer);

  if (!event && !user && (await calendarEventRequiresAuthentication(id))) {
    redirect(`/sign-in?returnTo=${encodeURIComponent(`/calendario/eventos/${id}`)}`);
  }
  if (!event) notFound();

  const attendance = user
    ? await getCalendarAttendanceForUser(event.id, user.id)
    : null;
  const isMembersOnly = event.visibility === "MEMBERS";
  const canRegister =
    !attendance &&
    event.registrationsEnabled &&
    (!isMembersOnly || Boolean(viewer));

  return (
    <main className="mx-auto min-h-[calc(100svh-8rem)] w-full max-w-6xl bg-white px-6 py-12 [font-family:var(--font-montserrat)] md:px-10 lg:px-14">
      <Link href="/calendario" className="text-sm font-semibold text-[var(--complement-800)] hover:underline">
        ← Volver al calendario
      </Link>
      <article className="mt-8 pb-12">
        <p className="text-sm text-black/65">
          {event.startsAt.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
          {" · "}
          {event.startsAt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
          {!event.allDay ? ` - ${event.endsAt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}` : ""}
        </p>
        {event.imageUrl ? (
          <div className="relative mb-8 mt-5 aspect-[16/9] max-h-[34rem] w-full overflow-hidden rounded-lg">
            <Image src={event.imageUrl} alt="" fill sizes="(min-width: 1024px) 1152px, (min-width: 768px) 896px, 100vw" className="object-cover" />
          </div>
        ) : null}
        <h1 className="mt-3 text-4xl font-semibold text-[var(--complement-900)] [font-family:var(--font-roboto-condensed)]">
          {event.title}
        </h1>
        {event.description ? <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-black/75">{event.description}</p> : null}
        {event.location ? <p className="mt-5 text-sm font-medium text-black/65">{event.location}</p> : null}

        {attendance ? (
          <section className="mt-8 border-t-2 border-[var(--complement-800)] pt-6">
            <h2 className="text-2xl font-semibold text-[var(--complement-900)]">Tu asistencia</h2>
            <p className={`mt-2 text-sm font-medium ${attendance.status === "CONFIRMED" ? "text-emerald-700" : attendance.status === "DECLINED" ? "text-rose-700" : "text-black/65"}`}>
              {attendanceLabels[attendance.status]}
            </p>
            {query.ok === "attendance_updated" ? (
              <p className="mt-2 text-sm font-medium text-emerald-700">Tu respuesta quedó guardada.</p>
            ) : null}
            {query.error ? (
              <p className="mt-2 text-sm font-medium text-rose-700">{errors[query.error] ?? "No pudimos guardar tu respuesta."}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <form action={respondToCalendarEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="status" value="CONFIRMED" />
                <button type="submit" className="rounded-lg bg-[var(--complement-800)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--complement-900)]">
                  Confirmar asistencia
                </button>
              </form>
              <form action={respondToCalendarEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="status" value="DECLINED" />
                <button type="submit" className="rounded-lg border border-[var(--complement-800)] px-5 py-2.5 text-sm font-semibold text-[var(--complement-900)] transition hover:bg-white">
                  No podré asistir
                </button>
              </form>
            </div>
          </section>
        ) : null}

        {!attendance && event.registrationsEnabled ? (
          <section className="mt-8 border-t-2 border-[var(--complement-800)] pt-6">
            <h2 className="text-2xl font-semibold text-[var(--complement-900)]">Inscripción</h2>
            {canRegister ? (
              <form action={registerForCalendarEventAction} className="mt-4 grid gap-3">
                <input type="hidden" name="eventId" value={event.id} />
                <input name="name" required defaultValue={user?.name ?? ""} placeholder="Nombre y apellido" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input name="email" type="email" required defaultValue={user?.email ?? ""} placeholder="Email" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input name="phone" type="tel" required placeholder="Teléfono" className="rounded-lg border border-slate-300 px-3 py-2" />
                {query.ok === "registered" ? <p className="text-sm font-medium text-emerald-700">Tu inscripción fue registrada.</p> : null}
                {query.error ? <p className="text-sm font-medium text-rose-700">{errors[query.error] ?? "No pudimos registrar tu inscripción."}</p> : null}
                <button type="submit" className="w-fit rounded-lg bg-[var(--complement-800)] px-5 py-2.5 text-sm font-semibold text-white">Inscribirme</button>
              </form>
            ) : <p className="mt-3 text-sm text-black/65">Esta inscripción es sólo para miembros autorizados.</p>}
          </section>
        ) : null}
      </article>
    </main>
  );
}