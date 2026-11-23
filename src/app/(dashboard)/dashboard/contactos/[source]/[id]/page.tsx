import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requirePermission } from "@/modules/auth/server/auth-guards";
import { DashboardShell } from "@/modules/dashboard/components/dashboard-shell";
import { ContactDetail } from "@/modules/contacts/views/contact-detail";
export default async function ContactPage({ params }: { params: Promise<{ source: string; id: string }> }) {
  const user = await requirePermission("contacts.view");
  const { source, id } = await params;
  if (!["contact", "admission"].includes(source) || id.length > 128) notFound();
  return <DashboardShell userEmail={user.email} userRole={user.role} userPermissions={user.permissionKeys} breadcrumbPage="Contactos"><Suspense fallback={<p>Cargando contacto…</p>}><ContactDetail source={source} id={id} canManage={user.permissionKeys.includes("contacts.manage")} canSchedule={source === "admission" && ["ADMIN", "SUPERADMIN"].includes(user.role) && user.permissionKeys.includes("contacts.manage")} /></Suspense></DashboardShell>;
}
