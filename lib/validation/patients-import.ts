import { z } from "zod";
import { PATIENT_HUB_STATUS_VALUES } from "@/lib/patients";
import {
  optionalContactEmail,
  optionalDateTimeFlexible,
  optionalPhoneFrSoft,
  trimToNull,
} from "@/lib/validation/common";
const nameField = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Prenom / nom requis.").max(120, "Maximum 120 caracteres."));

/** Une ligne CSV après mapping colonnes → même règles métier que création patient */
const hubStatusCsv = z.preprocess(
  (v) => {
    if (v === "" || v === undefined || v === null) return undefined;
    if (typeof v !== "string") return v;
    const u = v.trim().toUpperCase();
    return u === "" ? undefined : u;
  },
  z.enum(PATIENT_HUB_STATUS_VALUES).optional(),
);

export const patientCsvRowValidatedSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  email: optionalContactEmail,
  phone: optionalPhoneFrSoft,
  legalGuardian: z.preprocess(trimToNull, z.union([z.null(), z.string().max(200)])),
  nextAppointmentAt: optionalDateTimeFlexible,
  mutuelle: z.preprocess(trimToNull, z.union([z.null(), z.string().max(120)])),
  internalComment: z.preprocess(trimToNull, z.union([z.null(), z.string().max(4000)])),
  hubStatus: hubStatusCsv,
});

export type PatientCsvRowValidated = z.infer<typeof patientCsvRowValidatedSchema>;

/** Vérifie que les en-têtes contiennent au minimum prenom + nom */
export function validatePatientCsvHeaders(canonicalPresent: Set<string>): { ok: true } | { ok: false; message: string } {
  if (!canonicalPresent.has("firstName") || !canonicalPresent.has("lastName")) {
    return {
      ok: false,
      message:
        "En-tetes obligatoires : au moins une colonne prenom (firstName / prenom) et nom (lastName / nom).",
    };
  }
  return { ok: true };
}
