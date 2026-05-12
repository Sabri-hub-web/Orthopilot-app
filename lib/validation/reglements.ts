import { z } from "zod";
import { REGLEMENT_STATUS_VALUES } from "@/lib/reglements";
import { amountDuePositive, dateDueFlexible, trimToNull } from "@/lib/validation/common";

export const reglementCreateSchema = z.object({
  patientId: z.string().trim().min(1, "Patient requis."),
  amountDue: amountDuePositive,
  dueDate: dateDueFlexible,
  status: z.enum(REGLEMENT_STATUS_VALUES),
  comment: z.preprocess(trimToNull, z.union([z.null(), z.string().max(2000)])).optional(),
});

export const reglementUpdateSchema = z
  .object({
    patientId: z.string().trim().min(1, "Patient requis.").optional(),
    amountDue: amountDuePositive.optional(),
    dueDate: dateDueFlexible.optional(),
    status: z.enum(REGLEMENT_STATUS_VALUES).optional(),
    comment: z.preprocess(trimToNull, z.union([z.null(), z.string().max(2000)])).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Aucune donnee a modifier.",
  });
