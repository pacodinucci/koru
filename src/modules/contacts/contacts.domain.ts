import { legacyRolePermissions } from "../auth/permissions/permission-catalog";

export const CONTACT_STATUSES = ["NEW", "READ", "REPLIED"] as const;
export type ContactStatus = typeof CONTACT_STATUSES[number];
export type ContactSource = "contact" | "admission";
export type ContactQuery = { q: string; source: ContactSource | ""; status: ContactStatus | ""; page: number };
export function authorizeContacts(role: string | null | undefined, permissions?: readonly string[], action: "view" | "manage" = "view") {
  if (!role) return false;
  if (role === "SUPERADMIN") return true;
  const granted = permissions ?? (role === "ADMIN" ? legacyRolePermissions.ADMIN : []);
  return granted.includes("contacts.view") && (action === "view" || granted.includes("contacts.manage"));
}
export function parseContactQuery(params: URLSearchParams): ContactQuery | null {
  // Each filter has exactly one meaning; never silently discard supplied values.
  if (["q", "source", "status", "page"].some((key) => params.getAll(key).length > 1)) return null;
  const q = (params.get("q") ?? "").trim();
  const source = params.get("source") ?? "";
  const status = params.get("status") ?? "";
  const pageValue = params.get("page") ?? "1";
  if (q.length > 200 || !["", "contact", "admission"].includes(source) || !["", ...CONTACT_STATUSES].includes(status) || !/^[1-9]\d{0,5}$/.test(pageValue)) return null;
  return { q, source: source as ContactQuery["source"], status: status as ContactQuery["status"], page: Number(pageValue) };
}
export type ContactRow = { source: ContactSource; id: string; name: string; email: string; phone: string | null; status: ContactStatus; receivedAt: string };
export type ContactDetail = ContactRow & { message?: string; answers?: Record<string, string | number>; questionnaireVersion?: string };
export const STATUS_LABELS: Record<ContactStatus, string> = { NEW: "Nuevo", READ: "Leído", REPLIED: "Respondido" };
export const SOURCE_LABELS: Record<ContactSource, string> = { contact: "Formulario de contacto", admission: "Cuestionario inicial" };
