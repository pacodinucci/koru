import { appointmentHandlers } from "@/modules/appointments/server/appointments.http";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return appointmentHandlers.admin(request, (await context.params).id);
}
export async function POST(request: Request, context: Context) {
  return appointmentHandlers.admin(request, (await context.params).id);
}
