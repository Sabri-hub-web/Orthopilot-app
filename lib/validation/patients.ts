import { z } from "zod";
import { PATIENT_HUB_STATUS_VALUES } from "@/lib/patients";
import { optionalContactEmail, optionalDateTimeFlexible, optionalPhoneFrSoft, trimToNull } from "@/lib/validation/common";

const nameField = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Champ requis.").max(120, "Maximum 120 caracteres."));

/** Alias FR du formulaire (nom/prenom/…) → champs Prisma / API. */
function normalizePatientCreateBody(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const body = raw as Record<string, unknown>;

  const firstName = body.firstName ?? body.prenom ?? body.Prenom;
  const lastName = body.lastName ?? body.nom ?? body.Nom;
  const email = body.email ?? body.Email;
  const phone = body.phone ?? body.telephone ?? body.Telephone;
  const legalGuardian =
    body.legalGuardian ?? body.responsableLegal ?? body.responsable_legal;
  const nextAppointmentAt = body.nextAppointmentAt ?? body.prochainRdv;
  const internalComment = body.internalComment ?? body.commentaireInterne;
  const hubStatus = body.hubStatus ?? body.statut;

  const mutuelleFlag = body.mutuelle;
  const mutuelleNom = body.mutuelleNom ?? body.mutuelle_name ?? body.nomMutuelle;
  let mutuelle = body.mutuelle;
  if (typeof mutuelleFlag === "boolean") {
    mutuelle = mutuelleFlag ? mutuelleNom : null;
  } else if (
    typeof mutuelleFlag === "string" &&
    ["oui", "non", "true", "false", "1", "0"].includes(mutuelleFlag.trim().toLowerCase())
  ) {
    const yes = ["oui", "true", "1"].includes(mutuelleFlag.trim().toLowerCase());
    mutuelle = yes ? mutuelleNom : null;
  } else if (mutuelleNom !== undefined && (mutuelle === undefined || mutuelle === null || mutuelle === "")) {
    mutuelle = mutuelleNom;
  }

  return {
    firstName,
    lastName,
    email,
    phone,
    legalGuardian,
    nextAppointmentAt,
    mutuelle,
    internalComment,
    hubStatus,
  };
}

export const patientCreateSchema = z.preprocess(
  normalizePatientCreateBody,
  z.object({
    firstName: nameField,
    lastName: nameField,
    email: optionalContactEmail.optional().default(null),
    phone: optionalPhoneFrSoft.optional().default(null),
    legalGuardian: z
      .preprocess(trimToNull, z.union([z.null(), z.string().max(200)]))
      .optional()
      .default(null),
    nextAppointmentAt: optionalDateTimeFlexible.optional().default(null),
    mutuelle: z
      .preprocess(trimToNull, z.union([z.null(), z.string().max(120)]))
      .optional()
      .default(null),
    internalComment: z
      .preprocess(trimToNull, z.union([z.null(), z.string().max(4000)]))
      .optional()
      .default(null),
    hubStatus: z.enum(PATIENT_HUB_STATUS_VALUES).optional(),
  }),
);

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
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
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
