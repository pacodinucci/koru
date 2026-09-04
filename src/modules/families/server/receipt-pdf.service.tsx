import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";

const styles = StyleSheet.create({ page: { padding: 42, fontSize: 11 }, title: { fontSize: 20, marginBottom: 18 }, row: { marginBottom: 8 } });

export async function generateAndUploadReceipt(receipt: { id: string; number: number; familyName: string; amount: string; paidAt: Date }) {
  const document = <Document><Page size="A4" style={styles.page}><Text style={styles.title}>Koru · Recibo de pago</Text><View style={styles.row}><Text>Comprobante interno Nº {receipt.number}</Text></View><View style={styles.row}><Text>Familia: {receipt.familyName}</Text></View><View style={styles.row}><Text>Importe recibido: ${receipt.amount}</Text></View><View style={styles.row}><Text>Fecha: {receipt.paidAt.toLocaleDateString("es-AR")}</Text></View></Page></Document>;
  const buffer = await renderToBuffer(document);
  cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET });
  return new Promise<{ secureUrl: string; publicId: string }>((resolve, reject) => cloudinary.uploader.upload_stream({ resource_type: "raw", type: "private", folder: "koru/recibos", public_id: `recibo-${receipt.number}.pdf`, format: "pdf" }, (error, result) => error || !result ? reject(error ?? new Error("receipt_upload_failed")) : resolve({ secureUrl: result.secure_url, publicId: result.public_id })).end(buffer));
}
