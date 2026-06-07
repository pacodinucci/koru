import { z } from "zod";

export const teacherFormSchema = z.object({
  id: z.string().min(1),
  phone: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  isActive: z.boolean(),
  groupIds: z.array(z.string()),
});

export type TeacherFormInput = z.infer<typeof teacherFormSchema>;
