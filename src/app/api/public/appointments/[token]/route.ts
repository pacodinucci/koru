import { appointmentHandlers } from "@/modules/appointments/server/appointments.http";

type Context = { params: Promise<{ token: string }> };
export async function GET(request: Request, context: Context) {
  return appointmentHandlers.public(request, (await context.params).token);
}
export async function POST(request: Request, context: Context) {
  return appointmentHandlers.public(request, (await context.params).token);
}
