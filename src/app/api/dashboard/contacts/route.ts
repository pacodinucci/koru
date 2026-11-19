import { contactsHttp } from "@/modules/contacts/server/contacts.http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return contactsHttp(request); }
