import { NextResponse } from "next/server";
import { getDocumentDownloadUrl } from "@/modules/documents/server/cloudinary-documents";
import { getPublishedDocumentBySlug } from "@/modules/documents/server/document.repository";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function safeFileName(value: string) { return value.replace(/[\\"\r\n]/g, "_"); }
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const document = await getPublishedDocumentBySlug(slug);
  if (!document) return new NextResponse("Documento no encontrado.", { status: 404 });
  try {
    const upstream = await fetch(getDocumentDownloadUrl(document.cloudinaryPublicId), { cache: "no-store" });
    if (!upstream.ok || !upstream.body) return new NextResponse("No pudimos descargar el documento.", { status: 502 });
    return new NextResponse(upstream.body, { headers: { "Content-Type": document.mimeType || "application/pdf", "Content-Disposition": `attachment; filename="${safeFileName(document.originalFileName)}"`, "Cache-Control": "no-store, max-age=0" } });
  } catch (error) { console.error("[documents] Download failed", error); return new NextResponse("No pudimos descargar el documento.", { status: 502 }); }
}
