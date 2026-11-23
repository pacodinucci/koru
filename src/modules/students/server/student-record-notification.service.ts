import "server-only";

import { createElement } from "react";

import { env } from "@/lib/env";
import { sendMail } from "@/modules/mailing/server/mailing.service";
import { StudentRecordChangesEmail } from "@/modules/mailing/templates/student-record-changes-email";
import type { StudentViewer } from "@/modules/students/lib/student-read-scope";
import { getStudentRecordForViewer } from "@/modules/students/server/students.repository";

export async function notifyStudentRecordChanges(studentId: string, viewer: StudentViewer) {
  const student = await getStudentRecordForViewer(studentId, viewer);
  if (!student) throw new Error("No se pudo consultar el expediente para notificar a la familia.");

  const recipients = new Set(
    student.guardians.map((guardian) => guardian.email.trim().toLowerCase()).filter(Boolean),
  );
  if (recipients.size === 0) {
    throw new Error("La familia no tiene un correo registrado para recibir la solicitud de cambios.");
  }

  const studentName = `${student.firstName} ${student.lastName}`;
  const recordUrl = new URL("/family-dashboard/expediente", env.APP_URL || env.BETTER_AUTH_URL);
  recordUrl.hash = `alumno-${student.id}`;

  const results = await Promise.all(Array.from(recipients, (email) => sendMail({
    type: "MANUAL",
    to: [{ email }],
    subject: `Koru · Completar el expediente de ${studentName}`,
    react: createElement(StudentRecordChangesEmail, { studentName, recordUrl: recordUrl.toString() }),
    payload: { studentId, recordStatus: "NEEDS_CHANGES" },
  })));
  if (results.some((result) => result.status !== "sent")) {
    throw new Error("No se pudo enviar el correo de solicitud de cambios a todos los responsables. El expediente quedó marcado como Requiere cambios.");
  }
}
