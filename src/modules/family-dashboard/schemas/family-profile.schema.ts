import { z } from "zod";

const optionalAddressField = z.string().trim().max(120).optional().default("");

export const familyProfileSchema = z.object({
  streetAndNumber: optionalAddressField,
  neighborhood: optionalAddressField,
  cityAndState: optionalAddressField,
  postalCode: z.string().trim().max(20).optional().default(""),
});

export type FamilyProfileInput = z.infer<typeof familyProfileSchema>;