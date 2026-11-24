export type AppointmentStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "EXPIRED" | "SEND_FAILED";
export type AppointmentMode = "IN_PERSON" | "ONLINE";

export type AppointmentSlotView = {
  id: string;
  startsAt: string;
  endsAt: string;
};

export type PublicAppointmentInvitationView = {
  status: AppointmentStatus;
  recipientName: string;
  expiresAt: string;
  durationMinutes: number;
  mode: AppointmentMode;
  location: string;
  message: string | null;
  slots: AppointmentSlotView[];
  selectedSlotId: string | null;
};

export type AppointmentInvitationView = PublicAppointmentInvitationView & {
  id: string;
  recipientEmail: string;
  sentAt: string | null;
  confirmationEmailFailed: boolean;
  provider?: "GOOGLE_CALENDAR" | "EMAIL";
  googleEventUrl?: string | null;
  googleRsvpStatus?: "needsAction" | "accepted" | "declined" | "tentative" | null;
  googleSyncPending?: boolean;
  canManageGoogle?: boolean;
};

export type CreateAppointmentInvitationInput = {
  durationMinutes: number;
  mode: AppointmentMode;
  location: string;
  message?: string;
  startsAt: string[];
};
