import { z } from "zod";
import { EMAIL_CATEGORY_VALUES, EMAIL_STATUS_VALUES } from "@/lib/emails";
import { dateTimeFlexible, emailSenderSoft, trimToNull } from "@/lib/validation/common";

export const emailCreateSchema = z.object({
  sender: emailSenderSoft,
  subject: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Objet requis.").max(500, "Objet : maximum 500 caracteres.")),
  receivedAt: dateTimeFlexible,
  category: z.enum(EMAIL_CATEGORY_VALUES),
  status: z.enum(EMAIL_STATUS_VALUES).optional(),
  comment: z.preprocess(trimToNull, z.union([z.null(), z.string().max(2000)])).optional(),
  patientId: z.preprocess(trimToNull, z.union([z.null(), z.string().min(1)])).optional(),
  assigneeId: z.preprocess(trimToNull, z.union([z.null(), z.string().min(1)])).optional(),
});

export const emailUpdateSchema = z
  .object({
    sender: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1).max(200))
      .optional(),
    subject: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1).max(500))
      .optional(),
    receivedAt: dateTimeFlexible.optional(),
    category: z.enum(EMAIL_CATEGORY_VALUES).optional(),
    status: z.enum(EMAIL_STATUS_VALUES).optional(),
    comment: z.preprocess(trimToNull, z.union([z.null(), z.string().max(2000)])).optional(),
    patientId: z.preprocess(trimToNull, z.union([z.null(), z.string().min(1)])).optional(),
    assigneeId: z.preprocess(trimToNull, z.union([z.null(), z.string().min(1)])).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Aucune donnee a modifier.",
  });
