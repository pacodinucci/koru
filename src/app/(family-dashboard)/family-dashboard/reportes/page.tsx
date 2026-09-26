import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { prisma } from "@/lib/prisma";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";

export default async function FamilyReportsPage() {
  const { viewer, familyUser } = await requireFamilyDashboardAccess();
  const students = familyUser.familyId ? await prisma.student.findMany({
    where: { familyId: familyUser.familyId },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      reports: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          body: true,
          fileName: true,
          createdAt: true,
          teacher: { select: { displayName: true } },
        },
      },
    },
  }) : [];

  return (
    <SidebarProvider>
      <FamilySidebar userName={viewer.name} userEmail={viewer.email} />
      <SidebarInset>
        <FamilyDashboardHeader title="Reportes" />
        <main className="space-y-4 p-4 sm:p-6">
          <div><h1 className="text-xl font-semibold">Reportes de tus hijos</h1><p className="mt-1 text-sm text-muted-foreground">Informes compartidos por sus docentes.</p></div>
          {!students.length ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Todavía no hay niños registrados en tu familia.</CardContent></Card> : students.map((student) => (
            <Card key={student.id}>
              <CardHeader><CardTitle>{student.firstName} {student.lastName}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!student.reports.length ? <p className="text-sm text-muted-foreground">Todavía no hay reportes para este alumno.</p> : student.reports.map((report) => (
                  <article key={report.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-medium">{report.title}</h2><Badge variant="outline">{report.type === "PDF" ? "PDF" : "Texto"}</Badge></div>
                    <p className="mt-1 text-xs text-muted-foreground">{report.teacher.displayName} · {report.createdAt.toLocaleDateString("es-AR")}</p>
                    {report.type === "TEXT" ? <p className="mt-3 whitespace-pre-wrap text-sm">{report.body}</p> : (
                      <a className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline" href={`/api/student-reports/${report.id}/download`} target="_blank" rel="noopener noreferrer"><FileText className="size-4" /> Abrir {report.fileName || "PDF"}</a>
                    )}
                  </article>
                ))}
              </CardContent>
            </Card>
          ))}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

