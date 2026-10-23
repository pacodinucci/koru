"use client";

import { Button } from "@/components/ui/button";
import type { KanbanNotification, KanbanStatus } from "@/modules/kanban/types";

export type KanbanPanel = "archived" | "trashed" | "notifications";

export function KanbanRecoveryPanel({ state, statuses, onRestore, onDelete }: {
  state: "archived" | "trashed";
  statuses: KanbanStatus[];
  onRestore: (status: KanbanStatus) => void;
  onDelete: (status: KanbanStatus) => void;
}) {
  const items = statuses.filter((status) => state === "trashed" ? Boolean(status.trashedAt) : Boolean(status.archivedAt) && !status.trashedAt);
  return (
    <section aria-label={state === "archived" ? "Columnas archivadas" : "Columnas en la papelera"} className="space-y-3 rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold">{state === "archived" ? "Archivados" : "Papelera"}</h3>
      <p className="text-sm text-slate-600">Restaurar recupera las tarjetas y la configuración de la columna. No hay borrado automático.</p>
      {items.length === 0 ? <p className="text-sm text-slate-500">No hay columnas aquí.</p> : items.map((status) => (
        <article key={status.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <div><h4 className="font-medium">{status.name}</h4><p className="text-sm">{status.cards.length} tarjetas · {status.holdEnabled ? "Espera habilitada" : "Espera deshabilitada"}</p></div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" aria-label={`Restaurar ${status.name}`} onClick={() => onRestore(status)}>Restaurar</Button>
            {state === "trashed" ? <Button variant="destructive" aria-label={`Eliminar definitivamente ${status.name}`} onClick={() => onDelete(status)}>Eliminar definitivamente</Button> : null}
          </div>
        </article>
      ))}
    </section>
  );
}

export function KanbanNotificationsPanel({ notifications, onRead }: {
  notifications: KanbanNotification[];
  onRead: (id: string) => void;
}) {
  return (
    <section aria-label="Mis avisos de Kanban" className="space-y-3 rounded-xl border border-slate-200 p-4">
      <h2 className="font-semibold">Mis avisos</h2>
      <p className="text-sm text-slate-600">Solo tú puedes ver estos avisos y su estado de lectura. Se guardan en Koru; no se envían correos.</p>
      {notifications.length === 0 ? <p className="text-sm text-slate-500">Todavía no tienes avisos.</p> : notifications.map((notice) => (
        <article key={notice.id} className="space-y-2 rounded-lg border p-3">
          <p>{notice.message}</p>
          <p className="text-xs text-slate-500"><time dateTime={notice.createdAt}>{notice.createdAt.slice(0, 10).split("-").reverse().join("/")}</time> · {notice.readAt ? "Leído" : "Sin leer"}</p>
          {!notice.readAt ? <Button size="sm" variant="outline" onClick={() => onRead(notice.id)}>Marcar aviso como leído</Button> : null}
        </article>
      ))}
    </section>
  );
}
