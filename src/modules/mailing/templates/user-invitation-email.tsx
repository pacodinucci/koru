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
import { EMAIL_LOCALE, USER_INVITATION_SUBJECT } from "@/modules/mailing/lib/email-copy";
import type { UserRole } from "@prisma/client";

type UserInvitationEmailProps = {
  email: string;
  role: UserRole;
  invitationUrl: string;
  familyName?: string;
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "administrador",
  ADMIN_OPERATOR: "administrador operador",
  ADMIN_TEACHER: "administrador docente",
  SUPERADMIN: "superadministrador",
  TEACHER: "docente",
  PARENT: "familia",
};

export function UserInvitationEmail({
  email,
  role,
  invitationUrl,
  familyName,
}: UserInvitationEmailProps) {
  return (
    <Html lang={EMAIL_LOCALE}>
      <Head />
      <Preview>{USER_INVITATION_SUBJECT}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>Koru</Text>
          <Heading style={heading}>Te invitaron a crear tu cuenta</Heading>
          <Text style={text}>
            Tu correo electrónico <strong>{email}</strong> está autorizado para acceder a
            Koru con el rol de <strong>{roleLabels[role]}</strong>.
          </Text>
          {familyName ? (
            <Text style={text}>
              Tu cuenta quedará vinculada a la familia <strong>{familyName}</strong>.
            </Text>
          ) : null}
          <Section style={buttonWrapper}>
            <Button href={invitationUrl} style={button}>
              Crear cuenta
            </Button>
          </Section>
          <Text style={muted}>
            Si no esperabas esta invitación, puedes ignorar este correo.
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
