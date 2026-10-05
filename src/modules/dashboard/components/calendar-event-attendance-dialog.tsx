"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import {
  inviteExternalCalendarEventAttendeeAction,
  retryCalendarEventInvitationsAction,
} from "@/modules/dashboard/server/calendar.actions";

type Attendance = {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED";
  invitationSentAt?: Date | string | null;
  invitationError?: string | null;
  respondedAt?: Date | string | null;
};

type Props = {
  eventId: string;
  eventDate: string;
  attendances: Attendance[];
  error?: string;
  ok?: string;
};

const statusLabel = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  DECLINED: "No asiste",
};

function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export function CalendarEventAttendanceDialog({ eventId, eventDate, attendances, error, ok }: Props) {
  const pending = attendances.filter((item) => item.status === "PENDING").length;
  const confirmed = attendances.filter((item) => item.status === "CONFIRMED").length;
  const declined = attendances.filter((item) => item.status === "DECLINED").length;
  const unsent = attendances.some((item) => item.status === "PENDING" && !item.invitationSentAt);

  return (
    <ResponsiveDialog>
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <ResponsiveDialogTrigger render={<button type="button" className="text-left text-sm font-semibold text-slate-800 hover:underline" />}>
            Asistencia
          </ResponsiveDialogTrigger>
          <span className="text-xs text-slate-500">{attendances.length} invitados</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">{pending} pendientes</span>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">{confirmed} confirmados</span>
          <span className="rounded-md bg-rose-50 px-2 py-1 text-rose-700">{declined} no asisten</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">Hacé clic en Asistencia para ver el detalle y enviar invitaciones.</p>
      </section>

      <ResponsiveDialogContent className="[font-family:var(--font-montserrat)] [&_*]:[font-family:var(--font-montserrat)]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Asistencia</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Monitoreá las respuestas e invitá a personas sin usuario.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="scrollbar-none space-y-5">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <span className="rounded-lg bg-amber-50 p-3 text-amber-700">{pending} pendientes</span>
            <span className="rounded-lg bg-emerald-50 p-3 text-emerald-700">{confirmed} confirmados</span>
            <span className="rounded-lg bg-rose-50 p-3 text-rose-700">{declined} no asisten</span>
          </div>

          <section>
            <h3 className="text-sm font-semibold text-slate-900">Invitados ({attendances.length})</h3>
            {attendances.length ? (
              <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {attendances.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="break-all text-slate-600">{item.email}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.userId ? "Usuario" : "Invitado externo"}</p>
                      <p className="text-xs text-slate-500">
                        {item.invitationSentAt ? `Invitación enviada: ${formatDateTime(item.invitationSentAt)}` : "Invitación sin enviar"}
                      </p>
                      {item.respondedAt ? <p className="text-xs text-slate-500">Respondió: {formatDateTime(item.respondedAt)}</p> : null}
                      {item.invitationError ? <p className="text-xs text-rose-700">Error de envío: {item.invitationError}</p> : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{statusLabel[item.status]}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-slate-500">Todavía no hay invitados.</p>}
          </section>

          {unsent ? (
            <form action={retryCalendarEventInvitationsAction} onSubmit={(event) => event.stopPropagation()}>
              <input type="hidden" name="id" value={eventId} />
              <button type="submit" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                Reintentar emails pendientes
              </button>
            </form>
          ) : null}

          <section className="border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">Enviar invitación manual</h3>
            <p className="mt-1 text-xs text-slate-500">La persona recibirá un enlace personal para responder sin crear una cuenta.</p>
            <form action={inviteExternalCalendarEventAttendeeAction} onSubmit={(event) => event.stopPropagation()} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="eventDate" value={eventDate} />
              <label className="grid gap-1 text-xs font-medium text-slate-700">
                Nombre
                <input name="name" required maxLength={160} autoComplete="name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-700">
                Email
                <input name="email" type="email" required maxLength={320} autoComplete="email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Enviar invitación</button>
            </form>
            {error === "already_invited" ? <p className="mt-2 text-xs text-rose-700">Ese email ya fue invitado a este evento.</p> : null}
            {error === "manual_invitation_failed" ? <p className="mt-2 text-xs text-rose-700">No se pudo enviar el email. Podés reintentarlo arriba.</p> : null}
            {error === "invalid_manual_invitation" ? <p className="mt-2 text-xs text-rose-700">Ingresá un nombre y un email válidos.</p> : null}
            {ok === "manual_invitation_sent" ? <p className="mt-2 text-xs text-emerald-700">Invitación enviada.</p> : null}
          </section>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
