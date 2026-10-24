import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { psychopedagogyProfileSchema } from "@/modules/psychopedagogy/schemas/psychopedagogy-profile.schema";
import { getPsychopedagogyProfile, savePsychopedagogyProfileSection } from "@/modules/psychopedagogy/server/psychopedagogy-profile.repository";
import { getPsychopedagogyStudentForSuperadmin, getPsychopedagogyTeacherForUser } from "@/modules/psychopedagogy/server/psychopedagogy.repository";

type Context = { params: Promise<{ id: string }> };
const headers = { "Cache-Control": "private, no-store" };
const denied = () => NextResponse.json({ error: "Alumno no disponible." }, { status: 404, headers });

function unavailable(error: unknown) {
  console.error("[psychopedagogy-profile] No se pudo acceder al perfil", error);
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  const pendingMigration = code === "P2021" || code === "P2022";
  return NextResponse.json({
    error: pendingMigration
      ? "El perfil psicopedagógico todavía no está habilitado. Falta actualizar la base de datos."
      : "No pudimos acceder al perfil psicopedagógico. Intentá nuevamente.",
  }, { status: pendingMigration ? 503 : 500, headers });
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const user = await getAuthenticatedUser();
    if (user?.role !== "SUPERADMIN" && !(user?.role === "PSYCHOPEDAGOGY_TEACHER" && user.permissionKeys.includes("dashboard.access"))) {
      return denied();
    }
    const { id } = await params;
    if (!await getPsychopedagogyStudentForSuperadmin(id)) return denied();
    const profile = await getPsychopedagogyProfile(id);
    return NextResponse.json({ profile }, { headers });
  } catch (error) {
    return unavailable(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await getAuthenticatedUser();
    const isSuperadmin = user?.role === "SUPERADMIN";
    if (!user || (!isSuperadmin && !(user.role === "PSYCHOPEDAGOGY_TEACHER" && user.permissionKeys.includes("dashboard.access")))) return denied();
    const { id } = await params;
    if (!await getPsychopedagogyStudentForSuperadmin(id)) return denied();
    const input = await request.json().catch(() => null);
    if (isSuperadmin && input?.section !== "learning" && input?.section !== "accompaniment" && input?.section !== "intervention" && input?.section !== "instrument") return denied();
    const teacher = isSuperadmin ? null : await getPsychopedagogyTeacherForUser(user.id);
    if (!isSuperadmin && !teacher) return denied();
    const parsed = psychopedagogyProfileSchema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json({ error: "Revisá la sección, la fecha y los campos requeridos (títulos de hasta 160 caracteres y textos de hasta 10.000 caracteres)." }, { status: 400, headers });
    }
    await savePsychopedagogyProfileSection(id, teacher?.id ?? null, parsed.data, isSuperadmin ? user.id : null);
    return NextResponse.json({ ok: true }, { status: 201, headers });
  } catch (error) {
    return unavailable(error);
  }
}
