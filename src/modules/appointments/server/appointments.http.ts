import "server-only";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { createAppointmentHandlers } from "../appointments.handler";
import { appointments } from "./appointments.repository";

export const appointmentHandlers = createAppointmentHandlers({
  origin: new URL(env.APP_URL || env.BETTER_AUTH_URL).origin,
  actor: async () => {
    const user = await getAuthenticatedUser();
    return user ? { id: user.id, email: user.email, role: user.role, permissions: user.permissionKeys } : null;
  },
  contact: async id => {
    const inquiry = await prisma.admissionInquiry.findUnique({ where: { id }, select: { id: true, guardianNames: true, email: true } });
    return inquiry ? { id: inquiry.id, name: inquiry.guardianNames, email: inquiry.email } : null;
  },
  service: appointments,
});
