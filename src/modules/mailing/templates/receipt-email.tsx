import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

type ReceiptEmailProps = { receiptNumber: number; amount: string; paidAt: Date; downloadUrl: string };

export function ReceiptEmail({ receiptNumber, amount, paidAt, downloadUrl }: ReceiptEmailProps) {
  return <Html><Head/><Preview>Tu recibo Nº {receiptNumber} está disponible</Preview><Body style={body}><Container style={container}><Text style={eyebrow}>Koru · Administración</Text><Heading style={heading}>Recibo de pago disponible</Heading><Text style={text}>Registramos tu pago y ya podés descargar el comprobante.</Text><Section style={details}><Text style={detail}>Recibo Nº {receiptNumber}</Text><Text style={detail}>Importe: ${amount}</Text><Text style={detail}>Fecha: {paidAt.toLocaleDateString("es-AR")}</Text></Section><Section style={buttonWrapper}><Button href={downloadUrl} style={button}>Descargar recibo</Button></Section><Text style={muted}>Este enlace es personal y temporal. Si vence, podés descargar el recibo desde Mi cuenta.</Text></Container></Body></Html>;
}

const body = { margin: 0, backgroundColor: "#f8fafc", fontFamily: "Arial, sans-serif" };
const container = { margin: "0 auto", padding: "40px 24px", maxWidth: "560px" };
const eyebrow = { color: "#64748b", fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase" as const };
const heading = { color: "#172033", fontSize: "28px", lineHeight: "36px", margin: "12px 0 16px" };
const text = { color: "#334155", fontSize: "16px", lineHeight: "26px" };
const details = { margin: "24px 0", padding: "20px", backgroundColor: "#ffffff", border: "1px solid #dce4b8", borderRadius: "12px" };
const detail = { color: "#475569", fontSize: "14px", lineHeight: "21px", margin: "4px 0" };
const buttonWrapper = { margin: "28px 0" };
const button = { backgroundColor: "#334155", borderRadius: "12px", color: "#ffffff", display: "inline-block", fontSize: "15px", fontWeight: 700, padding: "14px 22px", textDecoration: "none" };
const muted = { color: "#64748b", fontSize: "13px", lineHeight: "20px" };