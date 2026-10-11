export const EMAIL_LOCALE = "es-MX";
export const RECEIPT_TIME_ZONE = "America/Mexico_City";
export const USER_INVITATION_SUBJECT = "Te invitaron a crear tu cuenta en Koru";

export type OperationEmailStatus = "PENDING" | "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED" | "CANCELED";

const operationStatusLabels: Record<OperationEmailStatus, string> = {
  PENDING: "pendiente",
  APPROVED: "aprobada",
  PARTIALLY_APPROVED: "aprobada parcialmente",
  REJECTED: "rechazada",
  CANCELED: "cancelada",
};

// Los conceptos de estos correos son femeninos: solicitud y comprobación.
export function operationEmailStatusLabel(status: OperationEmailStatus) {
  return operationStatusLabels[status];
}

export function calendarInvitationSubject(eventTitle: string) {
  return `Confirma tu asistencia: ${eventTitle}`;
}

export function formatReceiptDate(date: Date) {
  return date.toLocaleDateString(EMAIL_LOCALE, { timeZone: RECEIPT_TIME_ZONE });
}
