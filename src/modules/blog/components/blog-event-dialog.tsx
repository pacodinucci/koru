"use client";

import { ClockIcon, MapPinIcon } from "lucide-react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
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
};

export function BlogEventDialog({ event, children }: { event: EventItem; children: React.ReactNode }) {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);

  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger render={<button type="button" className="contents" />}>
        {children}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="md:max-w-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="pr-8 text-2xl" style={{ fontFamily: "var(--font-montserrat)" }}>{event.title}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-5 [font-family:var(--font-montserrat)]">
          {event.imageUrl ? <img src={event.imageUrl} alt="" className="max-h-64 w-full rounded-lg object-cover" /> : null}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><ClockIcon className="size-4" />{startsAt.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })} · {startsAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} - {endsAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</p>
            {event.location ? <p className="flex items-center gap-2"><MapPinIcon className="size-4" />{event.location}</p> : null}
          </div>
          {event.description ? <p className="whitespace-pre-wrap leading-relaxed text-foreground/80">{event.description}</p> : null}
          {event.registrationsEnabled ? (
            <form action={registerForCalendarEventAction} className="grid gap-3 border-t pt-5">
              <input type="hidden" name="eventId" value={event.id} />
              <h3 className="text-lg font-semibold">Inscripción</h3>
              <input name="name" required placeholder="Nombre y apellido" className="rounded-lg border px-3 py-2" />
              <input name="email" type="email" required placeholder="Email" className="rounded-lg border px-3 py-2" />
              <input name="phone" type="tel" required placeholder="Teléfono" className="rounded-lg border px-3 py-2" />
              <button type="submit" className="w-fit rounded-lg bg-[var(--complement-800)] px-5 py-2.5 text-sm font-semibold text-white">Inscribirme</button>
            </form>
          ) : null}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
