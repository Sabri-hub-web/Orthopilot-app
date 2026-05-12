import { z } from "zod";

/** Vide / espaces → null ; utile pour champs optionnels côté API. */
export function trimToNull(val: unknown): unknown {
  if (val === null || val === undefined) return null;
  if (typeof val !== "string") return val;
  const t = val.trim();
  return t === "" ? null : t;
}

/** Email de contact (patient, etc.) : vide OK, sinon format type adresse sans être ultra strict. */
export const optionalContactEmail = z.preprocess(
  trimToNull,
  z.union([z.null(), z.string().max(200)]).refine(
    (s) => s === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),
    { message: "Si renseigne, l'email doit ressembler a contact@domaine.fr" },
  ),
);

/**
 * Téléphone FR souple : chiffres, espaces, +, parenthèses, points, tirets.
 * Longueur 4–28 si renseigné.
 */
export const optionalPhoneFrSoft = z.preprocess(
  trimToNull,
  z.union([z.null(), z.string().max(28)]).refine(
    (s) =>
      s === null ||
      (s.length >= 4 &&
        s.length <= 28 &&
        /^[\d\s+().-]+$/.test(s)),
    {
      message:
        "Telephone : 4 a 28 caracteres, chiffres, espaces, +, parentheses, points ou tirets uniquement.",
    },
  ),
);

/** Expéditeur email cabinet : texte libre (nom + email, formats imparfaits), non strict email(). */
export const emailSenderSoft = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : ""),
  z.string().min(1, "Expediteur requis.").max(200, "Expediteur : maximum 200 caracteres."),
);

/** Date ou date-heure : parseable par JS, passé autorisé (saisie rétroactive). */
export const dateTimeFlexible = z
  .string()
  .min(1, "Date requise.")
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: "Date ou heure invalide." });

export const optionalDateTimeFlexible = z.preprocess(
  trimToNull,
  z.union([z.null(), z.string().max(40)]).refine(
    (s) => s === null || !Number.isNaN(Date.parse(s)),
    { message: "Date ou heure invalide." },
  ),
);

/** Échéance type tâche / règlement (jour ou ISO). */
export const dateDueFlexible = z
  .string()
  .min(1, "Echeance requise.")
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: "Echeance invalide." });

/** Montant : accepte chaîne numérique ; > 0 ; plafond raisonnable. */
export const amountDuePositive = z.coerce
  .number()
  .refine((n) => Number.isFinite(n), { message: "Montant invalide." })
  .positive("Le montant doit etre superieur a zero.")
  .max(1_000_000, "Montant trop eleve (maximum 1 000 000).");
