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
import type { UserRole } from "@prisma/client";

type UserInvitationEmailProps = {
  email: string;
  role: UserRole;
  invitationUrl: string;
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "administrador",
  TEACHER: "docente",
  PARENT: "familia",
};

export function UserInvitationEmail({
  email,
  role,
  invitationUrl,
}: UserInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Te invitaron a crear tu usuario en Koru</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>Koru</Text>
          <Heading style={heading}>Te invitaron a crear tu usuario</Heading>
          <Text style={text}>
            Autorizamos el email <strong>{email}</strong> para ingresar al
            ecosistema Koru con rol de <strong>{roleLabels[role]}</strong>.
          </Text>
          <Section style={buttonWrapper}>
            <Button href={invitationUrl} style={button}>
              Crear usuario
            </Button>
          </Section>
          <Text style={muted}>
            Si no esperabas esta invitación, podés ignorar este email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  margin: 0,
  backgroundColor: "#f8fafc",
  fontFamily: "Arial, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "40px 24px",
  maxWidth: "560px",
};

const eyebrow = {
  color: "#64748b",
  fontSize: "12px",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
};

const heading = {
  color: "#172033",
  fontSize: "28px",
  lineHeight: "36px",
  margin: "12px 0 16px",
};

const text = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "26px",
};

const buttonWrapper = {
  margin: "28px 0",
};

const button = {
  backgroundColor: "#334155",
  borderRadius: "12px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 700,
  padding: "14px 22px",
  textDecoration: "none",
};

const muted = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "20px",
};
