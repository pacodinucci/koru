"use client";

import Image from "next/image";
import Link from "next/link";
import { ClockIcon, MapPinIcon } from "lucide-react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { respondToCalendarEventAction } from "@/modules/calendar/server/calendar-attendance.actions";
import { registerForCalendarEventAction } from "@/modules/calendar/server/calendar-registration.actions";

type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  startsAt: Date | string;
  endsAt: Date | string;
  location?: string | null;
  visibility: "PUBLIC" | "MEMBERS";
  registrationsEnabled: boolean;
  attendanceConfirmationEnabled: boolean;
  attendances: Array<{
    id: string;
    status: "PENDING" | "CONFIRMED" | "DECLINED";
  }>;
};

const attendanceLabels = {
  PENDING: "Todavía no respondiste.",
  CONFIRMED: "Confirmaste tu asistencia.",
  DECLINED: "Avisaste que no podrás asistir.",
} as const;

export function BlogEventDialog({
  event,
  isAuthenticated,
  children,
}: {
  event: EventItem;
  isAuthenticated: boolean;
  children: React.ReactNode;
}) {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  const attendance = event.attendances[0];
  const eventPath = `/calendario/eventos/${event.id}`;

  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger render={<button type="button" className="contents" />}>
        {children}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="md:max-w-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="pr-8 text-2xl" style={{ fontFamily: "var(--font-montserrat)" }}>
            {event.title}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-5 [font-family:var(--font-montserrat)]">
          {event.imageUrl ? (
            <div className="relative aspect-[16/9] max-h-64 w-full overflow-hidden rounded-lg">
              <Image src={event.imageUrl} alt="" fill sizes="(min-width: 768px) 576px, 100vw" className="object-cover" />
            </div>
          ) : null}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <ClockIcon className="size-4" />
              {startsAt.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })} · {startsAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} - {endsAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            {event.location ? <p className="flex items-center gap-2"><MapPinIcon className="size-4" />{event.location}</p> : null}
          </div>
          {event.description ? <p className="whitespace-pre-wrap leading-relaxed text-foreground/80">{event.description}</p> : null}

          {attendance ? (
            <section className="space-y-4 border-t pt-5">
              <div>
                <h3 className="text-lg font-semibold">Confirmación de asistencia</h3>
                <p className={`mt-1 text-sm font-medium ${attendance.status === "CONFIRMED" ? "text-emerald-700" : attendance.status === "DECLINED" ? "text-rose-700" : "text-muted-foreground"}`}>
                  {attendanceLabels[attendance.status]}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
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
                  <button type="submit" className="rounded-lg border border-[var(--complement-800)] px-5 py-2.5 text-sm font-semibold text-[var(--complement-900)] transition hover:bg-muted">
                    No podré asistir
                  </button>
                </form>
              </div>
            </section>
          ) : event.attendanceConfirmationEnabled && !isAuthenticated ? (
            <section className="border-t pt-5">
              <h3 className="text-lg font-semibold">Confirmación de asistencia</h3>
              <p className="mt-1 text-sm text-muted-foreground">Ingresá con tu cuenta para ver y responder la invitación.</p>
              <Link href={`/sign-in?returnTo=${encodeURIComponent(eventPath)}`} className="mt-4 inline-flex rounded-lg bg-[var(--complement-800)] px-5 py-2.5 text-sm font-semibold text-white">
                Ingresar para responder
              </Link>
            </section>
          ) : null}

          {!attendance && event.registrationsEnabled ? (
            <form action={registerForCalendarEventAction} className="grid gap-3 border-t pt-5">
              <input type="hidden" name="eventId" value={event.id} />
              <h3 className="text-lg font-semibold">Inscripción</h3>
              <input name="name" required placeholder="Nombre y apellido" className="rounded-lg border px-3 py-2" />
              <input name="email" type="email" required placeholder="Email" className="rounded-lg border px-3 py-2" />
              <input name="phone" type="tel" required placeholder="Teléfono" className="rounded-lg border px-3 py-2" />
              <button type="submit" className="w-fit rounded-lg bg-[var(--complement-800)] px-5 py-2.5 text-sm font-semibold text-white">Inscribirme</button>
            </form>
          ) : null}

          <Link href={eventPath} className="inline-flex text-sm font-semibold text-[var(--complement-800)] underline underline-offset-4">
            Ver evento completo
          </Link>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}