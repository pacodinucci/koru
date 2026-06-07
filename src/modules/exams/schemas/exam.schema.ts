import { z } from "zod";

export const examStatusValues = ["DRAFT", "PUBLISHED"] as const;

export type ExamStatusValue = (typeof examStatusValues)[number];

export const examGradeInputSchema = z.object({
  studentId: z.string().min(1),
  score: z.coerce.number().min(0, "La nota mínima es 0.").max(100, "La nota máxima es 100."),
  observations: z.string().trim().optional(),
});

export const examFormSchema = z.object({
  id: z.string().optional(),
  groupId: z.string().min(1, "Seleccioná un grupo."),
  teacherId: z.string().optional(),
  title: z.string().trim().min(2, "Ingresá el título del examen."),
  subject: z.string().trim().optional(),
  examDate: z.string().min(1, "Ingresá la fecha."),
  description: z.string().trim().optional(),
  status: z.enum(examStatusValues),
  grades: z.array(examGradeInputSchema).min(1, "Cargá al menos una nota."),
});

export type ExamFormInput = z.infer<typeof examFormSchema>;