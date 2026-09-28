import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, isDevelopmentViewController } from "@/modules/auth/server/auth-guards";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";
import { getAgreementFileUrl } from "@/modules/follow-up-agreements/server/agreement-files";
import { getTeacherAgreementScope } from "@/modules/follow-up-agreements/server/agreements.repository";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await params;
  const agreement = await prisma.followUpAgreement.findUnique({
    where: { id },
    select: {
      teacherId: true, status: true, attachmentPublicId: true,
      attachmentFileName: true, attachmentMimeType: true,
      families: { select: { familyId: true } },
    },
  });
  if (!agreement?.attachmentPublicId || !agreement.attachmentMimeType) {
    return NextResponse.json({ error: "Adjunto no disponible." }, { status: 404 });
  }
  const previewFamilyId = isDevelopmentViewController(user)
    ? (await requireFamilyDashboardAccess()).familyUser.familyId : null;
  const familyAllowed = agreement.status === "PUBLISHED" && agreement.families.some((item) =>
    item.familyId === user.familyId && user.role === "PARENT" || item.familyId === previewFamilyId && previewFamilyId !== null,
  );
  const teacher = ["TEACHER", "ADMIN_TEACHER"].includes(user.role)
    ? await getTeacherAgreementScope(user.id) : null;
  if (!familyAllowed && teacher?.teacherId !== agreement.teacherId) {
    return NextResponse.json({ error: "Adjunto no disponible." }, { status: 404 });
  }
  try {
    const url = getAgreementFileUrl(agreement.attachmentPublicId, agreement.attachmentMimeType);
    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) throw new Error("agreement_download_failed");
    const inline = agreement.attachmentMimeType.startsWith("image/") || agreement.attachmentMimeType === "application/pdf";
    return new Response(upstream.body, {
      headers: {
        "Content-Type": agreement.attachmentMimeType,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(agreement.attachmentFileName || "adjunto")}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[follow-up-agreements] No se pudo abrir el adjunto", error);
    return NextResponse.json({ error: "No pudimos abrir el adjunto." }, { status: 503 });
  }
}
