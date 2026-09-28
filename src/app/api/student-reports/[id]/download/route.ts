import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, isDevelopmentViewController } from "@/modules/auth/server/auth-guards";
import { requireFamilyDashboardAccess } from "@/modules/family-dashboard/server/family-dashboard-access";
import { isStudentReportFileType } from "@/modules/teachers/lib/student-report-file";
import { getAssignedTeacherStudent } from "@/modules/teachers/server/student-reports.repository";
import { getStudentReportDownloadUrl } from "@/modules/teachers/server/student-report-cloudinary";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const report = await prisma.studentReport.findUnique({
    where: { id },
    select: { studentId: true, type: true, fileName: true, visibleToFamily: true, cloudinaryPublicId: true, student: { select: { familyId: true } } },
  });
  if (!report?.cloudinaryPublicId || !isStudentReportFileType(report.type)) {
    return NextResponse.json({ error: "Reporte no disponible." }, { status: 404 });
  }

  const previewFamilyId = isDevelopmentViewController(user)
    ? (await requireFamilyDashboardAccess()).familyUser.familyId
    : null;
  const familyAllowed = report.visibleToFamily && !!report.student.familyId && (
    (user.role === "PARENT" && report.student.familyId === user.familyId) ||
    (previewFamilyId !== null && report.student.familyId === previewFamilyId)
  );
  const teacherAllowed = !familyAllowed && !!(await getAssignedTeacherStudent(user.id, report.studentId));
  if (!familyAllowed && !teacherAllowed) {
    return NextResponse.json({ error: "Reporte no disponible." }, { status: 404 });
  }

  try {
    const url = getStudentReportDownloadUrl(report.cloudinaryPublicId, report.type);
    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) throw new Error("student_report_download_failed");
    const contentTypes = {
      PDF: "application/pdf",
      DOC: "application/msword",
      DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    const fileName = report.fileName || `reporte.${report.type.toLowerCase()}`;
    return new Response(upstream.body, {
      headers: {
        "Content-Type": contentTypes[report.type],
        "Content-Disposition": `${report.type === "PDF" ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "No pudimos abrir el documento." }, { status: 503 });
  }
}

