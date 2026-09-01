import Image from "next/image";

import {
  connectGoogleCalendarAction,
  disableGoogleCalendarAction,
  reactivateGoogleCalendarAction,
} from "@/modules/calendar/server/google-calendar.actions";

type ConnectionState =
  | { status: "NOT_CONNECTED" }
  | {
      status: "ACTIVE" | "NEEDS_REAUTH" | "DISABLED";
      syncConfirmedEvents: boolean;
      hasRequiredScope: boolean;
      lastError: string | null;
    };

type Props = {
  connection: ConnectionState;
  message?: string;
  error?: string;
  compact?: boolean;
};

const errorMessages: Record<string, string> = {
  authorization_failed: "No pudimos autorizar Google Calendar.",
  not_configured: "La integración todavía no está configurada.",
  reauthorization_required: "Google necesita que autorices nuevamente el acceso.",
  scope_missing: "Google no otorgó el permiso necesario para administrar eventos.",
};

export function GoogleCalendarConnectionCard({
  connection,
  message,
  error,
  compact = false,
}: Props) {
  const isActive =
    connection.status === "ACTIVE" && connection.hasRequiredScope;
  const needsReauth =
    connection.status === "NEEDS_REAUTH" ||
    (connection.status !== "NOT_CONNECTED" && !connection.hasRequiredScope);
  const isDisabled = connection.status === "DISABLED";
  const layoutClass = compact
    ? "space-y-3"
    : "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between";
  const buttonClass = compact
    ? "w-full"
    : "";

  const action = isActive ? (
    <form action={disableGoogleCalendarAction}>
      <button
        type="submit"
        className={`${buttonClass} rounded-lg border border-[var(--complement-800)] px-4 py-2 text-sm font-semibold text-[var(--complement-900)] transition hover:bg-white`}
      >
        Desactivar
      </button>
    </form>
  ) : isDisabled && connection.hasRequiredScope ? (
    <form action={reactivateGoogleCalendarAction}>
      <button
        type="submit"
        className={`${buttonClass} rounded-lg bg-[var(--complement-800)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--complement-900)]`}
      >
        Reactivar
      </button>
    </form>
  ) : (
    <form action={connectGoogleCalendarAction}>
      <button
        type="submit"
        className={`${buttonClass} rounded-lg bg-[var(--complement-800)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--complement-900)]`}
      >
        {needsReauth ? "Volver a conectar" : "Conectar"}
      </button>
    </form>
  );

  return (
    <section className={`rounded-xl border border-[#dce4b8] bg-[#fbfaf4] ${compact ? "p-3" : "p-4"}`}>
      <div className={layoutClass}>
        <div>
          <div className="flex items-center gap-2">
            <Image
              src="/assets/google.svg"
              alt=""
              width={20}
              height={20}
              aria-hidden="true"
              className="h-5 w-5 shrink-0"
            />
            <h2 className="text-sm font-semibold text-[var(--complement-900)]">
              Google Calendar
            </h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-black/60">
            {isActive
              ? "Tus eventos confirmados e inscripciones se sincronizan automáticamente."
              : needsReauth
                ? "Volvé a autorizar Google para continuar sincronizando."
                : isDisabled
                  ? "La sincronización automática está desactivada."
                  : "Conectalo para agregar los eventos que confirmes o en los que te inscribas."}
          </p>
          {message === "connected" ? (
            <p className="mt-2 text-xs font-medium text-emerald-700">
              Google Calendar quedó conectado.
            </p>
          ) : null}
          {message === "disabled" ? (
            <p className="mt-2 text-xs font-medium text-black/60">
              La sincronización quedó desactivada.
            </p>
          ) : null}
          {error ? (
            <p className="mt-2 text-xs font-medium text-rose-700">
              {errorMessages[error] ?? "No pudimos completar la operación."}
            </p>
          ) : null}
        </div>
        {action}
      </div>
    </section>
  );
}
