import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

import { EMAIL_LOCALE } from "@/modules/mailing/lib/email-copy";

type StudentRecordChangesEmailProps = {
  studentName: string;
  recordUrl: string;
};

export function StudentRecordChangesEmail({ studentName, recordUrl }: StudentRecordChangesEmailProps) {
  return (
    <Html lang={EMAIL_LOCALE}>
      <Head />
      <Preview>{`Falta completar información en el expediente de ${studentName}`}</Preview>
      <Body style={{ margin: 0, backgroundColor: "#f8fafc", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ margin: "0 auto", padding: "40px 24px", maxWidth: "560px" }}>
          <Heading style={{ color: "#172033", fontSize: "26px" }}>Hay información por completar</Heading>
          <Text>Hola, familia:</Text>
          <Text>Al revisar el expediente de {studentName}, encontramos información que necesita completarse o corregirse.</Text>
          <Text>Por favor, ingresa al portal de familias para revisar y actualizar el formulario.</Text>
          <Button href={recordUrl} style={{ backgroundColor: "#172033", color: "#ffffff", padding: "12px 20px", borderRadius: "8px" }}>Completar expediente</Button>
          <Text>Si tienes dudas sobre qué información falta, comunícate con el equipo de Koru.</Text>
        </Container>
      </Body>
    </Html>
  );
}
