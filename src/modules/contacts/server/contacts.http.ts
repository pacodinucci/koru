import "server-only";
import { env } from "@/lib/env";
import { getAuthenticatedUser } from "@/modules/auth/server/auth-guards";
import { createContactsHandler } from "../contacts.handler";
import { getContact, listContacts, setContactStatus } from "./contacts.repository";
export const contactsHttp = createContactsHandler({
  origin: new URL(env.APP_URL ?? env.BETTER_AUTH_URL).origin,
  role: async () => (await getAuthenticatedUser())?.role ?? null,
  permissions: async () => (await getAuthenticatedUser())?.permissionKeys ?? [],
  list: listContacts,
  detail: getContact,
  update: setContactStatus,
});
