import { Bell, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";

export default function FamilyDashboardPage() {
  return (
    <SidebarProvider>
      <FamilySidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar recursos o mensajes..." />
          </div>
          <Button variant="ghost" size="icon-sm" className="ml-auto">
            <Bell />
            <span className="sr-only">Notificaciones</span>
          </Button>
        </header>

        <main className="space-y-6 p-6">
          <section className="rounded-xl border bg-card p-6">
            <h1 className="text-2xl font-semibold tracking-tight">Family Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Punto de entrada para familias. Desde aca vamos a sumar calendario,
              recursos, mensajes y seguimiento.
            </p>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
