import { z } from "zod";
import { PATIENT_HUB_STATUS_VALUES } from "@/lib/patients";
import { optionalContactEmail, optionalDateTimeFlexible, optionalPhoneFrSoft, trimToNull } from "@/lib/validation/common";

const nameField = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Champ requis.").max(120, "Maximum 120 caracteres."));

export const patientCreateSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  email: optionalContactEmail,
  phone: optionalPhoneFrSoft,
  legalGuardian: z.preprocess(trimToNull, z.union([z.null(), z.string().max(200)])),
  nextAppointmentAt: optionalDateTimeFlexible,
  mutuelle: z.preprocess(trimToNull, z.union([z.null(), z.string().max(120)])),
  internalComment: z.preprocess(trimToNull, z.union([z.null(), z.string().max(4000)])),
  hubStatus: z.enum(PATIENT_HUB_STATUS_VALUES).optional(),
});

export const patientUpdateSchema = z
  .object({
    firstName: z.string().trim().min(1, "Prenom requis.").max(120).optional(),
    lastName: z.string().trim().min(1, "Nom requis.").max(120).optional(),
    email: optionalContactEmail.optional(),
    phone: optionalPhoneFrSoft.optional(),
    legalGuardian: z.preprocess(trimToNull, z.union([z.null(), z.string().max(200)])).optional(),
    nextAppointmentAt: optionalDateTimeFlexible.optional(),
    mutuelle: z.preprocess(trimToNull, z.union([z.null(), z.string().max(120)])).optional(),
    internalComment: z.preprocess(trimToNull, z.union([z.null(), z.string().max(4000)])).optional(),
    hubStatus: z.enum(PATIENT_HUB_STATUS_VALUES).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Aucune donnee a modifier.",
  });

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

const optionalBoolQuery = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z
    .union([z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true" || v === "1")),
);

const PATIENT_LIST_SORT_VALUES = [
  "name_asc",
  "name_desc",
  "next_rdv_asc",
  "next_rdv_desc",
  "created_desc",
  "created_asc",
] as const;

export const patientsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z
    .string()
    .optional()
    .transform((s) => {
      const t = s?.trim();
      return t === "" || t === undefined ? undefined : t;
    }),
  rdvSoon: optionalBoolQuery,
  rdvSoonDays: z.coerce.number().int().min(1).max(30).default(7),
  noNextRdv: optionalBoolQuery,
  reglementRetard: optionalBoolQuery,
  reglementOrange: optionalBoolQuery,
  openTask: optionalBoolQuery,
  urgentEmail: optionalBoolQuery,
  missingEmail: optionalBoolQuery,
  missingPhone: optionalBoolQuery,
  hasMutuelle: optionalBoolQuery,
  sort: z.enum(PATIENT_LIST_SORT_VALUES).default("name_asc"),
});

export type PatientsListQuery = z.infer<typeof patientsListQuerySchema>;
export type PatientListSort = (typeof PATIENT_LIST_SORT_VALUES)[number];
