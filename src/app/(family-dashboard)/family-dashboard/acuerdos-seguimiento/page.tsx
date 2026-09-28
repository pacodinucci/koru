import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { prisma } from "@/lib/prisma";
import { getActualAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { FamilyConsentButton } from "@/modules/follow-up-agreements/components/family-consent-button";
import { FamilyDashboardHeader } from "@/modules/family-dashboard/components/family-dashboard-header";
import { FamilySidebar } from "@/modules/family-dashboard/components/family-sidebar";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";

export default async function FamilyFollowUpAgreementsPage() {
  const [{ viewer, familyUser }, actualUser] = await Promise.all([
    requireFamilyDashboardAccess(), getActualAuthenticatedUser(),
  ]);
  const familyId = familyUser.familyId;
  const canConsent = actualUser?.role === "PARENT" && actualUser.familyId === familyId;
  const agreements = familyId ? await prisma.followUpAgreement.findMany({
    where: { status: "PUBLISHED", families: { some: { familyId } } },
    orderBy: { publishedAt: "desc" },
    include: {
      teacher: { select: { displayName: true } },
      families: { select: { familyId: true, consentedAt: true, family: { select: { name: true } } } },
      students: { include: { student: { select: { firstName: true, lastName: true } } } },
    },
  }) : [];

  return (
    <SidebarProvider>
      <FamilySidebar userName={viewer.name} userEmail={viewer.email} />
      <SidebarInset>
        <FamilyDashboardHeader title="Acuerdos de seguimiento" />
        <main className="space-y-4 p-4 sm:p-6 [font-family:var(--font-montserrat)]">
          <div><h1 className="text-xl font-semibold">Acuerdos de seguimiento</h1><p className="mt-1 text-sm text-muted-foreground">Constancias de citas compartidas con tu familia.</p></div>
          {!agreements.length ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Todavía no hay acuerdos compartidos con tu familia.</CardContent></Card> : agreements.map((agreement) => {
            const ownConsent = agreement.families.find((item) => item.familyId === familyId)?.consentedAt;
            return (
              <Card key={agreement.id}>
                <CardHeader className="flex-row flex-wrap items-start justify-between gap-2"><div><CardTitle className="text-base">{agreement.title}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{agreement.teacher.displayName} · {agreement.publishedAt?.toLocaleDateString("es-AR")}</p></div><Badge variant="outline">{ownConsent ? "Consentido" : "Pendiente"}</Badge></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="whitespace-pre-wrap text-slate-800">{agreement.body}</p>
                  <p><span className="font-medium">Niños involucrados:</span> {agreement.students.map((item) => `${item.student.firstName} ${item.student.lastName}`).join(", ")}</p>
                  <p><span className="font-medium">Familias involucradas:</span> {agreement.families.map((item) => item.family.name).join(", ")}</p>
                  {agreement.attachmentFileName ? <a href={`/api/follow-up-agreements/${agreement.id}/attachment`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline"><FileText className="size-4" />Abrir {agreement.attachmentFileName}</a> : null}
                  {ownConsent ? <p className="text-emerald-800">Tu familia dio su consentimiento el {ownConsent.toLocaleDateString("es-AR")}.</p> : canConsent ? <FamilyConsentButton agreementId={agreement.id} /> : <p className="text-muted-foreground">La previsualización no puede registrar un consentimiento.</p>}
                </CardContent>
              </Card>
            );
          })}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
