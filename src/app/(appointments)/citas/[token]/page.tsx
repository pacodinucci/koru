import type { Metadata } from "next";
import { AppointmentFamilyView } from "@/modules/appointments/views/appointment-family-view";

export const metadata: Metadata = {
  title: "Elegir horario de cita | Koru",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function AppointmentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AppointmentFamilyView token={token} />;
}
