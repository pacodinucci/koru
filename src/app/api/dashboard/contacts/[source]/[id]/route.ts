import { contactsHttp } from "@/modules/contacts/server/contacts.http";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ source: string; id: string }> };
export async function GET(request: Request, context: Context) { return contactsHttp(request, await context.params); }
export async function PATCH(request: Request, context: Context) { return contactsHttp(request, await context.params); }
