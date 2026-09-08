import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

type OperationDecisionEmailProps = { recipientName: string; title: string; status: string; detail: string; reason?: string | null };

export function OperationDecisionEmail({ recipientName, title, status, detail, reason }: OperationDecisionEmailProps) {
  return <Html><Head /><Preview>{`Tu ${title.toLowerCase()} fue ${status.toLowerCase()}`}</Preview><Body style={body}><Container style={container}><Text style={eyebrow}>Koru · Operaciones</Text><Heading style={heading}>Hay una decisión sobre tu {title.toLowerCase()}</Heading><Text style={text}>Hola {recipientName}, tu {title.toLowerCase()} fue <strong>{status.toLowerCase()}</strong>.</Text><Section style={details}><Text style={detailStyle}>{detail}</Text>{reason ? <Text style={detailStyle}>Motivo: {reason}</Text> : null}</Section><Text style={muted}>Podés consultar el detalle y el historial desde Operaciones.</Text></Container></Body></Html>;
}
const body = { margin: 0, backgroundColor: "#f8fafc", fontFamily: "Arial, sans-serif" };
const container = { margin: "0 auto", padding: "40px 24px", maxWidth: "560px" };
const eyebrow = { color: "#64748b", fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase" as const };
const heading = { color: "#172033", fontSize: "28px", lineHeight: "36px", margin: "12px 0 16px" };
const text = { color: "#334155", fontSize: "16px", lineHeight: "26px" };
const details = { margin: "24px 0", padding: "20px", backgroundColor: "#ffffff", border: "1px solid #dce4b8", borderRadius: "12px" };
const detailStyle = { color: "#475569", fontSize: "14px", lineHeight: "21px", margin: "4px 0" };
const muted = { color: "#64748b", fontSize: "13px", lineHeight: "20px" };