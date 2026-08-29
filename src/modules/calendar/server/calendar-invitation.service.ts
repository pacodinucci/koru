import "server-only";

import { sendCalendarEventInvitationEmail } from "@/modules/mailing/server/mailing.service";
import {
  listUnsentCalendarEventAttendances,
  markCalendarInvitationFailed,
  markCalendarInvitationSent,
} from "@/modules/calendar/server/calendar-attendance.repository";

export async function sendPendingCalendarEventInvitations(eventId: string) {
  const attendances = await listUnsentCalendarEventAttendances(eventId);
  const results: Array<{ attendanceId: string; status: "sent" | "failed" }> = [];

  for (const attendance of attendances) {
    try {
      const result = await sendCalendarEventInvitationEmail({
        attendanceId: attendance.id,
        email: attendance.email,
        recipientName: attendance.name,
        event: attendance.event,
      });

      if (result.status === "sent") {
        await markCalendarInvitationSent(attendance.id);
        results.push({ attendanceId: attendance.id, status: "sent" });
      } else {
        await markCalendarInvitationFailed(attendance.id, "mail_delivery_failed");
        results.push({ attendanceId: attendance.id, status: "failed" });
      }
    } catch (error) {
      await markCalendarInvitationFailed(
        attendance.id,
        error instanceof Error ? error.message : "unknown_mail_error",
      );
      results.push({ attendanceId: attendance.id, status: "failed" });
    }
  }

  return results;
}