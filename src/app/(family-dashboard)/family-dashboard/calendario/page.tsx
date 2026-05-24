import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { listVisibleEventsForUser } from "@/modules/dashboard/server/calendar.repository";

export default async function FamilyCalendarPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const sessionEmail =
    typeof session?.user?.email === "string" ? session.user.email.trim() : "";

  if (!sessionEmail) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true, role: true, name: true, email: true },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const events = await listVisibleEventsForUser(user.id, user.role);

  return (
    <SidebarProvider>
      <FamilySidebar userName={user.name} userEmail={user.email} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Calendario</h1>
        </header>
        <main className="p-6">
          <div className="rounded-xl border bg-white p-4">
            <ul className="space-y-3">
              {events.map((event) => (
                <li key={event.id} className="rounded-lg border p-3">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-slate-600">
                    {new Date(event.startsAt).toLocaleString("es-AR")} -{" "}
                    {new Date(event.endsAt).toLocaleString("es-AR")}
                  </p>
                </li>
              ))}
              {events.length === 0 ? (
                <li className="text-sm text-slate-500">No hay eventos visibles por ahora.</li>
              ) : null}
            </ul>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
