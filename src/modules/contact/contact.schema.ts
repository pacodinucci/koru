import { z } from "zod";

export const contactSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresá tu nombre."),
  email: z.email("Ingresá un email válido."),
  telefono: z.string().trim().optional(),
  mensaje: z
    .string()
    .trim()
    .min(10, "Contanos un poco más (mínimo 10 caracteres)."),
});

export type ContactValues = z.infer<typeof contactSchema>;
