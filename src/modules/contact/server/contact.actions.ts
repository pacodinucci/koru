"use server";

import { contactSchema } from "@/modules/contact/contact.schema";
import { createContactMessage } from "@/modules/contact/server/contact.repository";

export async function submitContactMessageAction(payload: unknown) {
  const parsed = contactSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false as const, message: "Datos inválidos." };
  }

  await createContactMessage(parsed.data);

  return { ok: true as const, message: "Mensaje enviado." };
}
