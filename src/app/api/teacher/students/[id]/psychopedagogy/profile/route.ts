import { GET as getProfile, POST as saveProfile } from "@/modules/psychopedagogy/server/psychopedagogy-profile.handlers";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  return getProfile(request, context);
}

export async function POST(request: Request, context: Context) {
  return saveProfile(request, context);
}
