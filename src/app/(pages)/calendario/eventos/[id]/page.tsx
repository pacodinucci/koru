import Link from "next/link";
import { notFound } from "next/navigation";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { registerForCalendarEventAction } from "@/modules/calendar/server/calendar-registration.actions";
import { getCalendarEventForViewer } from "@/modules/calendar/server/calendar-registration.repository";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
};

const errors: Record<string, string> = {
  already_registered: "Ya estás inscripto/a en este evento.",
  members_only: "La inscripción es sólo para miembros.",
  missing_registration_data: "Completá nombre, email y teléfono.",
  registrations_disabled: "Este evento no acepta inscripciones.",
};

export default async function CalendarEventPage({ params, searchParams }: Props) {
  const [{ id }, { ok, error }, user] = await Promise.all([
    params,
    searchParams,
    getAuthenticatedUser(),
  ]);
  const viewer = user ? { id: user.id, role: user.role } : undefined;
  const event = await getCalendarEventForViewer(id, viewer);

  if (!event) notFound();

  const isMembersOnly = event.visibility === "MEMBERS";
  const canRegister = event.registrationsEnabled && (!isMembersOnly || Boolean(viewer));

  return (
    <main className="mx-auto min-h-[calc(100svh-8rem)] w-full max-w-3xl px-6 py-12 [font-family:var(--font-montserrat)] md:px-10">
      <Link href="/calendario" className="text-sm font-semibold text-[var(--complement-800)] hover:underline">← Volver al calendario</Link>
      <article className="mt-6 rounded-xl border-2 border-[var(--complement-800)] bg-[#fbfaf4] p-6 md:p-9">
        <p className="text-sm text-black/65">
          {event.startsAt.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
          {" · "}
          {event.startsAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          {!event.allDay ? ` - ${event.endsAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : ""}
        </p>
        {event.imageUrl ? <img src={event.imageUrl} alt="" className="mb-6 max-h-96 w-full rounded-lg object-cover" /> : null}
        <h1 className="mt-3 text-4xl font-semibold text-[var(--complement-900)] [font-family:var(--font-roboto-condensed)]">{event.title}</h1>
        {event.description ? <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-black/75">{event.description}</p> : null}
        {event.location ? <p className="mt-5 text-sm font-medium text-black/65">{event.location}</p> : null}
        {event.registrationsEnabled ? (
          <section className="mt-8 border-t-2 border-[var(--complement-800)] pt-6">
            <h2 className="text-2xl font-semibold text-[var(--complement-900)]">Inscripción</h2>
            {canRegister ? (
              <form action={registerForCalendarEventAction} className="mt-4 grid gap-3">
                <input type="hidden" name="eventId" value={event.id} />
                <input name="name" required defaultValue={user?.name ?? ""} placeholder="Nombre y apellido" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input name="email" type="email" required defaultValue={user?.email ?? ""} placeholder="Email" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input name="phone" type="tel" required placeholder="Teléfono" className="rounded-lg border border-slate-300 px-3 py-2" />
                {ok === "registered" ? <p className="text-sm font-medium text-emerald-700">Tu inscripción fue registrada.</p> : null}
                {error ? <p className="text-sm font-medium text-rose-700">{errors[error] ?? "No pudimos registrar tu inscripción."}</p> : null}
                <button type="submit" className="w-fit rounded-lg bg-[var(--complement-800)] px-5 py-2.5 text-sm font-semibold text-white">Inscribirme</button>
              </form>
            ) : <p className="mt-3 text-sm text-black/65">Esta inscripción es sólo para miembros autorizados.</p>}
          </section>
        ) : null}
      </article>
    </main>
  );
}
