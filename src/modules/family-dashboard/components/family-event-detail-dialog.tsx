"use client";

import Image from "next/image";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapPinIcon,
  XCircleIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { respondToCalendarEventAction } from "@/modules/calendar/server/calendar-attendance.actions";
import { registerForCalendarEventAction } from "@/modules/calendar/server/calendar-registration.actions";
import type { NormalizedFamilyCalendarEvent } from "@/modules/family-dashboard/lib/family-calendar-event";

const attendanceLabels = {
  PENDING: "Todavía no respondiste.",
  CONFIRMED: "Confirmaste tu asistencia.",
  DECLINED: "Avisaste que no podrás asistir.",
} as const;

const errorMessages: Record<string, string> = {
  already_registered: "Ya estás inscripto/a en este evento.",
  attendance_not_found: "No encontramos una invitación asociada a tu usuario.",
  event_not_found: "El evento ya no está disponible.",
  invalid_attendance_status: "La respuesta seleccionada no es válida.",
  members_only: "La inscripción es sólo para miembros.",
  missing_registration_data: "Completá nombre, email y teléfono.",
  registrations_disabled: "Este evento no acepta inscripciones.",
};

type FamilyEventDetailDialogProps = {
  event?: NormalizedFamilyCalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnTo: string;
  viewer: { name: string; email: string };
  feedback?: { ok?: string; error?: string };
};

function formatEventDate(event: NormalizedFamilyCalendarEvent) {
  const date = event.startsAt.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (event.allDay) return `${date} · Todo el día`;

  const startsAt = event.startsAt.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endsAt = event.endsAt.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${startsAt} - ${endsAt}`;
}

export function FamilyEventDetailDialog({
  event,
  open,
  onOpenChange,
  returnTo,
  viewer,
  feedback,
}: FamilyEventDetailDialogProps) {
  if (!event) return null;

  const attendance = event.attendances[0];
  const attendanceStatus = attendance?.status ?? "PENDING";
  const canRespond = event.attendanceConfirmationEnabled;
  const successMessage =
    feedback?.ok === "registered"
      ? "Tu inscripción fue registrada."
      : feedback?.ok === "attendance_updated"
        ? "Tu respuesta quedó guardada."
        : undefined;
  const errorMessage = feedback?.error
    ? (errorMessages[feedback.error] ?? "No pudimos guardar tu respuesta.")
    : undefined;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="md:max-w-2xl [font-family:var(--font-montserrat)]">
        <ResponsiveDialogHeader className="space-y-2 border-b-border">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <Badge variant="secondary">
              {event.kind === "MEETING" ? "Reunión" : "Evento"}
            </Badge>
            {canRespond ? (
              <Badge
                variant="outline"
                className={
                  attendanceStatus === "CONFIRMED"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : attendanceStatus === "DECLINED"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : undefined
                }
              >
                {attendanceStatus === "CONFIRMED"
                  ? "Asistencia confirmada"
                  : attendanceStatus === "DECLINED"
                    ? "No asistirás"
                    : "Respuesta pendiente"}
              </Badge>
            ) : null}
          </div>
          <ResponsiveDialogTitle className="pr-8 text-2xl font-semibold ![font-family:var(--font-montserrat)]">
            {event.title}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-5 [font-family:var(--font-montserrat)]">
          {event.imageUrl ? (
            <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded-xl bg-muted">
              <Image
                src={event.imageUrl}
                alt=""
                fill
                sizes="(min-width: 768px) 672px, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              {event.allDay ? (
                <CalendarDaysIcon className="mt-0.5 size-4 shrink-0" />
              ) : (
                <ClockIcon className="mt-0.5 size-4 shrink-0" />
              )}
              <span className="capitalize">{formatEventDate(event)}</span>
            </p>
            {event.location ? (
              <p className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                <span>{event.location}</span>
              </p>
            ) : null}
          </div>

          {event.description ? (
            <p className="whitespace-pre-wrap leading-relaxed text-foreground/80">
              {event.description}
            </p>
          ) : null}

          {successMessage ? (
            <div
              role="status"
              className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
            >
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
              {successMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800"
            >
              <XCircleIcon className="mt-0.5 size-4 shrink-0" />
              {errorMessage}
            </div>
          ) : null}

          {canRespond ? (
            <section className="space-y-4 border-t pt-5">
              <div>
                <h3 className="text-lg font-semibold">Confirmación de asistencia</h3>
                <p
                  className={`mt-1 text-sm font-medium ${
                    attendanceStatus === "CONFIRMED"
                      ? "text-emerald-700"
                      : attendanceStatus === "DECLINED"
                        ? "text-rose-700"
                        : "text-muted-foreground"
                  }`}
                >
                  {attendanceLabels[attendanceStatus]}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <form action={respondToCalendarEventAction}>
                  <input type="hidden" name="eventId" value={event.id} />
                  <input type="hidden" name="status" value="CONFIRMED" />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-[var(--complement-800)] text-white hover:bg-[var(--complement-900)] sm:w-auto"
                  >
                    Confirmar asistencia
                  </Button>
                </form>
                <form action={respondToCalendarEventAction}>
                  <input type="hidden" name="eventId" value={event.id} />
                  <input type="hidden" name="status" value="DECLINED" />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="lg"
                    className="w-full border-[var(--complement-800)] text-[var(--complement-900)] sm:w-auto"
                  >
                    No podré asistir
                  </Button>
                </form>
              </div>
            </section>
          ) : event.registrationsEnabled ? (
            <form
              action={registerForCalendarEventAction}
              className="grid gap-3 border-t pt-5"
            >
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <div>
                <h3 className="text-lg font-semibold">Inscripción</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Completá tus datos para reservar tu lugar.
                </p>
              </div>
              <Input
                name="name"
                required
                defaultValue={viewer.name}
                placeholder="Nombre y apellido"
                aria-label="Nombre y apellido"
              />
              <Input
                name="email"
                type="email"
                required
                defaultValue={viewer.email}
                placeholder="Email"
                aria-label="Email"
              />
              <Input
                name="phone"
                type="tel"
                required
                placeholder="Teléfono"
                aria-label="Teléfono"
              />
              <Button
                type="submit"
                size="lg"
                className="mt-1 w-full bg-[var(--complement-800)] text-white hover:bg-[var(--complement-900)] sm:w-fit"
              >
                Inscribirme
              </Button>
            </form>
          ) : null}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
