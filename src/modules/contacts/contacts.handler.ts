import { authorizeContacts, CONTACT_STATUSES, parseContactQuery, type ContactDetail, type ContactQuery, type ContactSource, type ContactStatus } from "./contacts.domain";
export type ContactsDependencies = {
  /** Canonical public origin from trusted server configuration, never Host headers. */
  origin?: string;
  role: () => Promise<string | null>;
  permissions?: () => Promise<readonly string[]>;
  list: (query: ContactQuery) => Promise<unknown>;
  detail: (source: ContactSource, id: string) => Promise<ContactDetail | null>;
  update: (source: ContactSource, id: string, status: ContactStatus) => Promise<boolean>;
};
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
export function createContactsHandler(dependencies: ContactsDependencies) {
  return async function contactsHttp(request: Request, identity?: { source: string; id: string }) {
    try {
      const [role, permissions] = await Promise.all([dependencies.role(), dependencies.permissions?.()]);
      const action = request.method === "PATCH" ? "manage" : "view";
      if (!authorizeContacts(role, permissions, action)) return json({ error: "Acceso no autorizado." }, 403);
      if (!identity) {
        const query = parseContactQuery(new URL(request.url).searchParams);
        return query ? json(await dependencies.list(query)) : json({ error: "Filtros no válidos." }, 400);
      }
      if (!["contact", "admission"].includes(identity.source) || !identity.id || identity.id.length > 128) return json({ error: "Contacto no encontrado." }, 404);
      const source = identity.source as ContactSource;
      if (request.method === "PATCH") {
        const origin = request.headers.get("origin");
        if (!origin || origin !== (dependencies.origin ?? new URL(request.url).origin)) return json({ error: "Origen no autorizado." }, 403);
        // Read bounded bytes, not an unbounded request.text().
        const reader = request.body?.getReader();
        if (!reader) return json({ error: "Estado no válido." }, 400);
        let text = ""; let size = 0; const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read(); if (done) break;
            size += value.byteLength;
            if (size > 128) { await reader.cancel(); return json({ error: "Estado no válido." }, 400); }
            text += decoder.decode(value, { stream: true });
          }
          text += decoder.decode();
        } finally { reader.releaseLock(); }
        let input: unknown;
        try { input = JSON.parse(text); } catch { return json({ error: "Estado no válido." }, 400); }
        if (!input || typeof input !== "object" || Object.keys(input).length !== 1 || !("status" in input) || !CONTACT_STATUSES.includes(input.status as ContactStatus)) return json({ error: "Estado no válido." }, 400);
        return await dependencies.update(source, identity.id, input.status as ContactStatus) ? json({ success: true }) : json({ error: "Contacto no encontrado." }, 404);
      }
      const item = await dependencies.detail(source, identity.id);
      return item ? json({ item }) : json({ error: "Contacto no encontrado." }, 404);
    } catch { return json({ error: "No pudimos cargar o actualizar el contacto. Intentá de nuevo." }, 500); }
  };
}
