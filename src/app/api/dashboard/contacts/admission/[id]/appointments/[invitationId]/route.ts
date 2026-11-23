import { appointmentHandlers } from "@/modules/appointments/server/appointments.http";

export async function POST(request: Request, context: { params: Promise<{ id: string; invitationId: string }> }) {
  const { id, invitationId } = await context.params;
  return appointmentHandlers.admin(request, id, invitationId);
}
