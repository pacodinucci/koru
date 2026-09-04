import { z } from "zod";

import { studentGuardianRelationshipValues } from "@/modules/students/schemas/student.schema";

const requiredText = (message: string) => z.string().trim().min(2, message);
const optionalText = z.string().trim().optional().default("");

export const familyStudentIdentitySchema = z.object({
  studentId: z.string().optional(),
  firstName: requiredText("Ingresá el nombre."),
  lastName: requiredText("Ingresá el apellido."),
  documentType: z.string().trim().min(2, "Seleccioná el tipo de documento."),
  documentNumber: z.string().trim().min(4, "Ingresá un documento válido.").max(40),
  birthDate: z.string().min(1, "Ingresá la fecha de nacimiento."),
  groupId: z.string().min(1, "Seleccioná un grupo."),
});

export const familyStudentAddressSchema = z.object({
  studentId: z.string().min(1),
  streetAndNumber: requiredText("Ingresá la calle y el número."),
  neighborhood: requiredText("Ingresá el barrio o localidad."),
  cityAndState: requiredText("Ingresá la ciudad y provincia."),
  postalCode: z.string().trim().min(3, "Ingresá el código postal."),
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
      message: "Ingresá la institución y el número de afiliación.",
    });
  }
});

export const familyStudentContactsSchema = z.object({
  studentId: z.string().min(1),
  primaryContact: z.object({
    fullName: requiredText("Ingresá el nombre del contacto principal."),
    relationship: z.enum(studentGuardianRelationshipValues),
    phone: z.string().trim().min(6, "Ingresá un teléfono válido.").max(30),
  }),
});

export type FamilyStudentIdentityInput = z.infer<typeof familyStudentIdentitySchema>;
export type FamilyStudentAddressInput = z.infer<typeof familyStudentAddressSchema>;
export type FamilyStudentMedicalInput = z.infer<typeof familyStudentMedicalSchema>;
export type FamilyStudentContactsInput = z.infer<typeof familyStudentContactsSchema>;
export const familyStudentResponsibleSchema = z.object({
  studentId: z.string().min(1),
  fullName: requiredText("Ingresá el nombre del responsable."),
  relationship: requiredText("Ingresá el parentesco o vínculo."),
  phone: z.string().trim().min(6, "Ingresá un teléfono válido.").max(30),
  canPickup: z.boolean(),
  emergencyContact: z.boolean(),
});

export type FamilyStudentResponsibleInput = z.infer<typeof familyStudentResponsibleSchema>;
