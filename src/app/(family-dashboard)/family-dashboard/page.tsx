import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";

export default async function FamilyDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const userName = session.user.name?.trim() || "Usuario";
  const userEmail = session.user.email;

  return (
    <SidebarProvider>
      <FamilySidebar userName={userName} userEmail={userEmail} />
      <SidebarInset>
        <FamilyDashboardHeader />

        <main className="space-y-6 p-6">
          <section className="rounded-xl border bg-card p-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Family Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Punto de entrada para familias. Desde aquí vamos a sumar
              calendario, recursos, mensajes y seguimiento.
            </p>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
