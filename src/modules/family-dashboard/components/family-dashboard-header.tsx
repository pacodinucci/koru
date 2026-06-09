import { Bell, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

type FamilyDashboardHeaderProps = {
  title?: string;
};

export function FamilyDashboardHeader({ title }: FamilyDashboardHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <SidebarTrigger />
      {title ? <h1 className="text-lg font-semibold">{title}</h1> : null}
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar recursos o mensajes..." />
      </div>
      <Button variant="ghost" size="icon-sm" className="ml-auto">
        <Bell />
        <span className="sr-only">Notificaciones</span>
      </Button>
    </header>
  );
}
