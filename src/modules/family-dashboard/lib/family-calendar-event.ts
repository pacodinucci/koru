import type {
  CalendarAttendanceStatus,
  CalendarAudienceType,
  CalendarEventStatus,
  CalendarEventVisibility,
} from "@prisma/client";

export type FamilyCalendarEventItem = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  startsAt: Date | string;
  endsAt: Date | string;
  allDay: boolean;
  location?: string | null;
  visibility: CalendarEventVisibility;
  audienceType: CalendarAudienceType;
  status: CalendarEventStatus;
  kind: "EVENT" | "MEETING";
  registrationsEnabled: boolean;
  attendanceConfirmationEnabled: boolean;
  attendances: Array<{
    id: string;
    name: string;
    email: string;
    status: CalendarAttendanceStatus;
  }>;
};

export type NormalizedFamilyCalendarEvent = Omit<
  FamilyCalendarEventItem,
  "startsAt" | "endsAt"
> & {
  startsAt: Date;
  endsAt: Date;
};
