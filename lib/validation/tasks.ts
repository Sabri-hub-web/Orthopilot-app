import { z } from "zod";
import { TASK_PRIORITY_VALUES, TASK_STATUS_VALUES } from "@/lib/tasks";
import { dateDueFlexible, trimToNull } from "@/lib/validation/common";

export const taskCreateSchema = z.object({
  title: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(3, "Titre : au moins 3 caracteres.").max(200, "Titre : maximum 200 caracteres.")),
  comment: z.preprocess(trimToNull, z.union([z.null(), z.string().max(500)])).optional(),
  dueDate: dateDueFlexible,
  priority: z.enum(TASK_PRIORITY_VALUES),
  status: z.enum(TASK_STATUS_VALUES),
  assigneeId: z.preprocess(trimToNull, z.union([z.null(), z.string().min(1)])).optional(),
  patientId: z.preprocess(trimToNull, z.union([z.null(), z.string().min(1)])).optional(),
});

export const taskUpdateSchema = z
  .object({
    title: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(3, "Titre : au moins 3 caracteres.").max(200))
      .optional(),
    comment: z.preprocess(trimToNull, z.union([z.null(), z.string().max(500)])).optional(),
    dueDate: dateDueFlexible.optional(),
    priority: z.enum(TASK_PRIORITY_VALUES).optional(),
    status: z.enum(TASK_STATUS_VALUES).optional(),
    assigneeId: z.preprocess(trimToNull, z.union([z.null(), z.string().min(1)])).optional(),
    patientId: z.preprocess(trimToNull, z.union([z.null(), z.string().min(1)])).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Aucune donnee a modifier.",
  });
