import { redirect } from "next/navigation";

import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { getActualAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import {
  BASECAMP_PROJECT_URL,
  BASECAMP_ROLES,
  BasecampError,
  basecampConfigured,
  getAccessToken,
  getProjectCards,
  type BasecampCard,
} from "@/modules/basecamp/server/basecamp";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  config: "La conexión todavía no está configurada en Koru.",
  session: "Iniciá sesión en Koru y volvé a conectar Basecamp.",
  state: "La solicitud de conexión venció o no coincide. Intentá de nuevo.",
  account: "Tu cuenta de Basecamp no tiene acceso a la cuenta de Koru.",
  oauth: "No pudimos completar la conexión. Intentá de nuevo.",
};

const toolLabels: Record<string, string> = {
  todoset: "Tareas",
  message_board: "Mensajes",
  vault: "Documentos y archivos",
  kanban_board: "Tablero",
  schedule: "Calendario",
  chat: "Chat",
  questionnaire: "Preguntas",
};

function ToolCard({ card }: { card: BasecampCard }) {
  return (
    <article className="flex min-h-64 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{toolLabels[card.name] ?? "Herramienta"}</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{card.title}</h2>
        </div>
      </div>
      {card.preview.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {card.preview.map((item) => (
            <li key={item.url} className="truncate">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-red-700 hover:underline">
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Abrí esta tarjeta para ver su contenido en Basecamp.</p>
      )}
      <a href={card.appUrl} target="_blank" rel="noopener noreferrer" className="mt-auto pt-5 text-sm font-medium text-red-700 hover:underline">
        Abrir en Basecamp ↗
      </a>
    </article>
  );
}

export default async function BasecampPage({ searchParams }: { searchParams: Promise<{ error?: string; connected?: string }> }) {
  const user = await getActualAuthenticatedUser();
  if (!user) redirect("/sign-in");
  if (!BASECAMP_ROLES.some((role) => role === user.role)) redirect("/dashboard?error=forbidden");

  const params = await searchParams;
  let connected = false;
  let projectName = "Área Psicopedagógica";
  let cards: BasecampCard[] = [];
  let message = params.error ? errorMessages[params.error] ?? errorMessages.oauth : null;

  if (basecampConfigured()) {
    try {
      const token = await getAccessToken(user.id);
      connected = Boolean(token);
      if (token) {
        const project = await getProjectCards(token);
        projectName = project.projectName;
        cards = project.cards;
      }
    } catch (error) {
      message = error instanceof BasecampError ? error.message : "No pudimos cargar Basecamp en este momento.";
    }
  } else {
    message = errorMessages.config;
  }

  return (
    <DashboardShell userEmail={user.email} userRole={user.role} userPermissions={user.permissionKeys} breadcrumbPage="Basecamp">
      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Basecamp</h1>
            <p className="mt-2 text-sm text-slate-600">{connected ? `Proyecto ${projectName} · Solo lectura` : "Conectá tu propia cuenta para ver las tarjetas del proyecto."}</p>
          </div>
          {connected ? (
            <form action="/api/basecamp/disconnect" method="post">
              <button type="submit" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Desconectar mi cuenta</button>
            </form>
          ) : basecampConfigured() ? (
            <a href="/api/basecamp/connect" className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800">Conectar Basecamp</a>
          ) : null}
        </div>

        {message ? <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{message}</p> : null}
        {params.connected === "1" && !message ? <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Tu cuenta de Basecamp está conectada.</p> : null}

        {connected && cards.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => <ToolCard key={card.id} card={card} />)}
          </div>
        ) : connected && !message ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Este proyecto no tiene tarjetas habilitadas.</p>
        ) : null}

        <p className="text-xs text-slate-500">
          Las tarjetas se consultan con los permisos de tu cuenta. No se copian datos del proyecto a Koru. {" "}
          <a href={BASECAMP_PROJECT_URL} target="_blank" rel="noopener noreferrer" className="underline">Ver proyecto original</a>
        </p>
      </section>
    </DashboardShell>
  );
}
