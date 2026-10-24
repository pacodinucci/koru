import { z } from "zod";

import type { PsychopedagogyProfilePayload } from "@/modules/psychopedagogy/lib/profile-contract";

const text = z.string().trim().min(1).max(10000);
const title = z.string().trim().min(1).max(160);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  if (value.startsWith("0000-")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});

// Strict objects reject client-supplied ownership and fields from other sections.
export const psychopedagogyProfileSchema: z.ZodType<PsychopedagogyProfilePayload> = z.discriminatedUnion("section", [
  z.strictObject({ section: z.literal("learning"), description: text }),
  z.strictObject({ section: z.literal("accompaniment"), date, kind: z.enum(["INDIVIDUAL", "FAMILY"]), title, body: text }),
  z.strictObject({
    section: z.literal("intervention"), date, title,
    observationAnalysis: text, strategyFeedback: text, workPlan: text,
    implementation: text, evaluationResults: text,
  }),
  z.strictObject({
    section: z.literal("instrument"), date, name: title, body: text,
    kind: z.enum(["QUESTIONNAIRE", "ASSESSMENT", "INTERVIEW", "TEST", "OTHER"]).optional(),
  }),
]);
