import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, isDevelopmentViewController } from "@/modules/auth/server/auth-guards";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";
import { getAssignedTeacherStudent } from "@/modules/teachers/server/student-reports.repository";
import { getStudentReportDownloadUrl } from "@/modules/teachers/server/student-report-cloudinary";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const report = await prisma.studentReport.findUnique({
    where: { id },
    select: { studentId: true, cloudinaryPublicId: true, student: { select: { familyId: true } } },
  });
  if (!report?.cloudinaryPublicId) return NextResponse.json({ error: "Reporte no disponible." }, { status: 404 });

  const previewFamilyId = isDevelopmentViewController(user)
    ? (await requireFamilyDashboardAccess()).familyUser.familyId
    : null;
  const familyAllowed = !!report.student.familyId && (
    (user.role === "PARENT" && report.student.familyId === user.familyId) ||
    (previewFamilyId !== null && report.student.familyId === previewFamilyId)
  );
  const teacherAllowed = !familyAllowed && !!(await getAssignedTeacherStudent(user.id, report.studentId));
  if (!familyAllowed && !teacherAllowed) {
    return NextResponse.json({ error: "Reporte no disponible." }, { status: 404 });
  }

  try {
    const url = getStudentReportDownloadUrl(report.cloudinaryPublicId);
    return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "No pudimos abrir el PDF." }, { status: 503 });
  }
}

