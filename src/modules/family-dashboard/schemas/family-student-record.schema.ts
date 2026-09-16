import { z } from "zod";

const requiredText = (message: string) => z.string().trim().min(2, message);
const optionalText = z.string().trim().optional().default("");

export const familyStudentIdentitySchema = z.object({
  studentId: z.string().optional(),
  firstName: requiredText("IngresÃ¡ el nombre."),
  lastName: requiredText("IngresÃ¡ el apellido."),
  documentType: z.string().trim().min(2, "SeleccionÃ¡ el tipo de documento.").optional().default("CURP"),
  documentNumber: z.string().trim().max(40).optional().default(""),
  birthDate: z.string().min(1, "IngresÃ¡ la fecha de nacimiento."),
  groupId: z.string().min(1, "SeleccionÃ¡ un grupo."),
});

export const familyStudentAddressSchema = z.object({
  studentId: z.string().min(1),
  streetAndNumber: requiredText("IngresÃ¡ la calle y el nÃºmero."),
  neighborhood: requiredText("IngresÃ¡ el barrio o localidad."),
  cityAndState: requiredText("IngresÃ¡ la ciudad y provincia."),
  postalCode: z.string().trim().min(3, "IngresÃ¡ el cÃ³digo postal."),
});

export const familyStudentMedicalSchema = z.object({
  studentId: z.string().min(1),
  bloodType: optionalText,
  knownAllergies: optionalText,
  medicalConditions: optionalText,
  regularMedications: optionalText,
  hasHealthInsurance: z.boolean(),
  insuranceProviderAndPolicy: optionalText,
}).superRefine((value, context) => {
  if (value.hasHealthInsurance && !value.insuranceProviderAndPolicy) {
    context.addIssue({
      code: "custom",
      path: ["insuranceProviderAndPolicy"],
      message: "IngresÃ¡ la instituciÃ³n y el nÃºmero de afiliaciÃ³n.",
    });
  }
});

export const familyStudentCompletionSchema = z.object({
  studentId: z.string().min(1),
});

export type FamilyStudentIdentityInput = z.infer<typeof familyStudentIdentitySchema>;
export type FamilyStudentAddressInput = z.infer<typeof familyStudentAddressSchema>;
export type FamilyStudentMedicalInput = z.infer<typeof familyStudentMedicalSchema>;
export type FamilyStudentCompletionInput = z.infer<typeof familyStudentCompletionSchema>;
export const familyStudentResponsibleSchema = z.object({
  studentId: z.string().optional().default(""),
  fullName: requiredText("IngresÃ¡ el nombre del responsable."),
  relationship: requiredText("IngresÃ¡ el parentesco o vÃ­nculo."),
  phone: z.string().trim().min(6, "IngresÃ¡ un telÃ©fono vÃ¡lido.").max(30),
  canPickup: z.boolean(),
  emergencyContact: z.boolean(),
});

export type FamilyStudentResponsibleInput = z.infer<typeof familyStudentResponsibleSchema>;

export const familyResponsibleUpdateSchema = z.object({
  id: z.string().min(1),
  fullName: requiredText("Ingresá el nombre del responsable."),
  relationship: requiredText("Ingresá el rol del responsable."),
  phone: z.string().trim().min(6, "Ingresá un teléfono válido.").max(30),
  canPickup: z.boolean(),
  emergencyContact: z.boolean(),
});
export type FamilyResponsibleUpdateInput = z.infer<typeof familyResponsibleUpdateSchema>;
