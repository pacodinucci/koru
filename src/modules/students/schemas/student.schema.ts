import { z } from "zod";

export const studentStatusValues = ["ACTIVE", "INACTIVE", "GRADUATED"] as const;
export const studentGuardianRelationshipValues = [
  "MOTHER",
  "FATHER",
  "TUTOR",
  "GUARDIAN",
  "OTHER",
] as const;

export type StudentStatusValue = (typeof studentStatusValues)[number];
export type StudentGuardianRelationshipValue =
  (typeof studentGuardianRelationshipValues)[number];

export const studentGuardianSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ingresá un email válido."),
  relationship: z.enum(studentGuardianRelationshipValues),
  isPrimary: z.boolean(),
  canPickup: z.boolean(),
  emergencyContact: z.boolean(),
});

export const studentFormSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().trim().min(2, "Ingresá el nombre."),
  lastName: z.string().trim().min(2, "Ingresá el apellido."),
  birthDate: z.string().min(1, "Ingresá la fecha de nacimiento."),
  groupId: z.string().min(1, "Seleccioná un grupo."),
  status: z.enum(studentStatusValues),
  notes: z.string().trim().optional(),
  guardians: z
    .array(studentGuardianSchema)
    .min(1, "Agregá al menos un familiar vinculado."),
});

export type StudentFormInput = z.infer<typeof studentFormSchema>;

