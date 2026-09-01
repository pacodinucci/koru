import { NextResponse } from "next/server";

import { getAdminUser } from "@/modules/auth/server/auth-guards";
import { listCloudinaryImages } from "@/modules/media/server/cloudinary-images";

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const result = await listCloudinaryImages({ cursor, limit: 24 });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cms-media-library] Listing failed", error);
    return NextResponse.json(
      { ok: false, error: "No pudimos cargar la biblioteca de imágenes." },
      { status: 500 },
    );
  }
}
