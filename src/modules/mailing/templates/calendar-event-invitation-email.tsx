import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type CalendarEventInvitationEmailProps = {
  recipientName: string;
  eventTitle: string;
  startsAt: Date;
  endsAt: Date;
  location?: string | null;
  eventUrl: string;
};

export function CalendarEventInvitationEmail({
  recipientName,
  eventTitle,
  startsAt,
  endsAt,
  location,
  eventUrl,
}: CalendarEventInvitationEmailProps) {
  const date = startsAt.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = `${startsAt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} - ${endsAt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <Html>
      <Head />
      <Preview>Confirmá tu asistencia a {eventTitle}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>Koru · Calendario</Text>
          <Heading style={heading}>Confirmá tu asistencia</Heading>
          <Text style={text}>Hola {recipientName}, te invitamos al siguiente evento:</Text>
          <Section style={details}>
            <Text style={eventName}>{eventTitle}</Text>
            <Text style={detailText}>{date}</Text>
            <Text style={detailText}>{time}</Text>
            {location ? <Text style={detailText}>{location}</Text> : null}
          </Section>
          <Section style={buttonWrapper}>
            <Button href={eventUrl} style={button}>Ver evento y responder</Button>
          </Section>
          <Text style={muted}>Ingresá con el mismo email que recibió esta invitación.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { margin: 0, backgroundColor: "#f8fafc", fontFamily: "Arial, sans-serif" };
const container = { margin: "0 auto", padding: "40px 24px", maxWidth: "560px" };
const eyebrow = { color: "#64748b", fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase" as const };
const heading = { color: "#172033", fontSize: "28px", lineHeight: "36px", margin: "12px 0 16px" };
const text = { color: "#334155", fontSize: "16px", lineHeight: "26px" };
const details = { margin: "24px 0", padding: "20px", backgroundColor: "#ffffff", border: "1px solid #dce4b8", borderRadius: "12px" };
const eventName = { color: "#2f3716", fontSize: "18px", fontWeight: 700, margin: "0 0 12px" };
const detailText = { color: "#475569", fontSize: "14px", lineHeight: "21px", margin: "4px 0" };
const buttonWrapper = { margin: "28px 0" };
const button = { backgroundColor: "#334155", borderRadius: "12px", color: "#ffffff", display: "inline-block", fontSize: "15px", fontWeight: 700, padding: "14px 22px", textDecoration: "none" };
const muted = { color: "#64748b", fontSize: "13px", lineHeight: "20px" };