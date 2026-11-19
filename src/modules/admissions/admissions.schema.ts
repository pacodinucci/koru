import { z } from "zod";
import { QUESTIONNAIRE_SECTIONS, QUESTIONNAIRE_VERSION } from "./initial-questionnaire";

const fields: Record<string, z.ZodType> = {};
for (const question of QUESTIONNAIRE_SECTIONS.flatMap((section) => section.questions)) {
  fields[question.key] = question.required
    ? z.string().trim().min(1).max(question.maxLength ?? 200)
    : z.string().trim().max(question.maxLength ?? 4000).optional().default("");
}
fields.email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
fields.age = z.number().int().min(0).max(25);
fields.phone = z.string().trim().min(5).max(40).regex(/^[+\d\s().-]+$/).refine((value) => (value.match(/\d/g) ?? []).length >= 5);
fields.birthDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10);
});
export const admissionSchema = z.object({
  questionnaireVersion: z.literal(QUESTIONNAIRE_VERSION),
  idempotencyKey: z.uuid(),
  answers: z.object(fields).strict(),
  website: z.literal("").optional(),
}).strict();
export type AdmissionPayload = z.infer<typeof admissionSchema>;
