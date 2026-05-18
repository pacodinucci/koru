import { prisma } from "@/lib/prisma";
import type { ContactValues } from "@/modules/contact/contact.schema";

function normalizeTelefono(telefono?: string) {
  const value = telefono?.trim() ?? "";
  return value.length > 0 ? value : null;
}

export async function createContactMessage(data: ContactValues) {
  return prisma.contactMessage.create({
    data: {
      nombre: data.nombre.trim(),
      email: data.email.trim().toLowerCase(),
      telefono: normalizeTelefono(data.telefono),
      mensaje: data.mensaje.trim(),
    },
    select: {
      id: true,
      createdAt: true,
    },
  });
}
