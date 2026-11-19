import { Suspense } from "react";
import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { ContactsList } from "@/modules/contacts/views/contacts-list";
export default async function ContactsPage() {
  const user = await requirePermission("contacts.view");
  return <DashboardShell userEmail={user.email} userRole={user.role} userPermissions={user.permissionKeys} breadcrumbPage="Contactos"><Suspense fallback={<p>Cargando contactos…</p>}><ContactsList /></Suspense></DashboardShell>;
}
