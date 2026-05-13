import type { PatientHubStatus, Prisma } from "@prisma/client";
import type { CsvCanonicalField } from "@/lib/patients-csv";
import { parsePatientCsv } from "@/lib/patients-csv";
import {
  patientCsvRowValidatedSchema,
  validatePatientCsvHeaders,
} from "@/lib/validation/patients-import";
import type { PatientCsvImportLineResult, PatientCsvImportResponse } from "@/types/domain";
import type { PatientFormPayload } from "@/types/domain";
import { prisma } from "@/server/db/client";
import { writeActivityLog } from "@/server/activity-log";

export const PATIENT_CSV_MAX_BYTES = 2 * 1024 * 1024;
export const PATIENT_CSV_MAX_ROWS = 500;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function formatZodIssues(err: { issues: { message: string }[] }): string {
  return err.issues.map((i) => i.message).join(" ; ");
}

type Tx = Prisma.TransactionClient;

async function findPatientForCsvRow(
  tx: Tx,
  validated: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  },
): Promise<{ id: string } | null | "ambiguous_phone" | "ambiguous_name"> {
  if (validated.email) {
    const byEmail = await tx.patient.findFirst({
      where: { email: { equals: validated.email, mode: "insensitive" } },
      select: { id: true },
    });
    if (byEmail) return byEmail;
  }

  const phoneDigits = validated.phone ? digitsOnly(validated.phone) : "";
  if (phoneDigits.length >= 9) {
    const withPhone = await tx.patient.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    });
    const matches = withPhone.filter((p) => digitsOnly(p.phone ?? "") === phoneDigits);
    if (matches.length > 1) return "ambiguous_phone";
    if (matches.length === 1) return { id: matches[0].id };
  }

  const byName = await tx.patient.findMany({
    where: {
      AND: [
        { firstName: { equals: validated.firstName, mode: "insensitive" } },
        { lastName: { equals: validated.lastName, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  if (byName.length > 1) return "ambiguous_name";
  if (byName.length === 1) return byName[0];

  return null;
}

function buildCreateData(validated: {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  legalGuardian: string | null;
  nextAppointmentAt: string | null;
  mutuelle: string | null;
  internalComment: string | null;
  hubStatus?: PatientHubStatus;
}) {
  return {
    firstName: validated.firstName,
    lastName: validated.lastName,
    email: validated.email,
    phone: validated.phone,
    legalGuardian: validated.legalGuardian,
    nextAppointmentAt: validated.nextAppointmentAt ? new Date(validated.nextAppointmentAt) : null,
    mutuelle: validated.mutuelle,
    internalComment: validated.internalComment,
    hubStatus: validated.hubStatus ?? ("ACTIF" as PatientHubStatus),
  };
}

function buildUpdatePayload(
  validated: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    legalGuardian: string | null;
    nextAppointmentAt: string | null;
    mutuelle: string | null;
    internalComment: string | null;
    hubStatus?: PatientHubStatus;
  },
  presentFields: Set<CsvCanonicalField>,
): Partial<PatientFormPayload> {
  const out: Partial<PatientFormPayload> = {
    firstName: validated.firstName,
    lastName: validated.lastName,
  };
  if (presentFields.has("email")) out.email = validated.email;
  if (presentFields.has("phone")) out.phone = validated.phone;
  if (presentFields.has("legalGuardian")) out.legalGuardian = validated.legalGuardian;
  if (presentFields.has("nextAppointmentAt")) {
    out.nextAppointmentAt = validated.nextAppointmentAt;
  }
  if (presentFields.has("mutuelle")) out.mutuelle = validated.mutuelle;
  if (presentFields.has("internalComment")) out.internalComment = validated.internalComment;
  if (presentFields.has("hubStatus") && validated.hubStatus) out.hubStatus = validated.hubStatus;
  return out;
}

export async function runPatientCsvImport(params: {
  csvText: string;
  actorName: string;
}): Promise<PatientCsvImportResponse> {
  const bytes = new TextEncoder().encode(params.csvText).length;
  if (bytes > PATIENT_CSV_MAX_BYTES) {
    throw new Error(`Fichier trop volumineux (maximum ${PATIENT_CSV_MAX_BYTES / 1024} Ko).`);
  }

  const parsed = parsePatientCsv(params.csvText);
  const canonicalPresent = new Set(
    parsed.canonicalHeaders.filter((h): h is NonNullable<typeof h> => h !== null),
  );
  const headerCheck = validatePatientCsvHeaders(canonicalPresent);
  if (!headerCheck.ok) {
    throw new Error(headerCheck.message);
  }

  if (parsed.rows.length > PATIENT_CSV_MAX_ROWS) {
    throw new Error(`Trop de lignes (maximum ${PATIENT_CSV_MAX_ROWS}).`);
  }

  const lines: PatientCsvImportLineResult[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  await prisma.$transaction(async (tx) => {
    for (const { lineNumber, raw, presentFields } of parsed.rows) {
      const rowInput = {
        firstName: raw.firstName ?? "",
        lastName: raw.lastName ?? "",
        email: raw.email ?? "",
        phone: raw.phone ?? "",
        legalGuardian: raw.legalGuardian ?? "",
        nextAppointmentAt: raw.nextAppointmentAt ?? "",
        mutuelle: raw.mutuelle ?? "",
        internalComment: raw.internalComment ?? "",
        hubStatus: raw.hubStatus ?? "",
      };

      const parsedRow = patientCsvRowValidatedSchema.safeParse(rowInput);
      if (!parsedRow.success) {
        errors++;
        lines.push({
          line: lineNumber,
          status: "error",
          message: formatZodIssues(parsedRow.error),
        });
        continue;
      }

      const v = parsedRow.data;
      const match = await findPatientForCsvRow(tx, {
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phone: v.phone,
      });

      if (match === "ambiguous_phone") {
        skipped++;
        lines.push({
          line: lineNumber,
          status: "skipped",
          message: "Plusieurs patients avec ce numero de telephone.",
        });
        continue;
      }
      if (match === "ambiguous_name") {
        skipped++;
        lines.push({
          line: lineNumber,
          status: "skipped",
          message: "Plusieurs patients avec le meme nom et prenom.",
        });
        continue;
      }

      if (match === null) {
        const createdRow = await tx.patient.create({
          data: buildCreateData(v),
          select: { id: true },
        });
        created++;
        lines.push({ line: lineNumber, status: "created", patientId: createdRow.id });
        continue;
      }

      const updatePayload = buildUpdatePayload(v, presentFields);
      await tx.patient.update({
        where: { id: match.id },
        data: {
          ...(updatePayload.firstName !== undefined ? { firstName: updatePayload.firstName } : {}),
          ...(updatePayload.lastName !== undefined ? { lastName: updatePayload.lastName } : {}),
          ...(updatePayload.email !== undefined ? { email: updatePayload.email } : {}),
          ...(updatePayload.phone !== undefined ? { phone: updatePayload.phone } : {}),
          ...(updatePayload.legalGuardian !== undefined
            ? { legalGuardian: updatePayload.legalGuardian }
            : {}),
          ...(updatePayload.nextAppointmentAt !== undefined
            ? {
                nextAppointmentAt: updatePayload.nextAppointmentAt
                  ? new Date(updatePayload.nextAppointmentAt)
                  : null,
              }
            : {}),
          ...(updatePayload.mutuelle !== undefined ? { mutuelle: updatePayload.mutuelle } : {}),
          ...(updatePayload.internalComment !== undefined
            ? { internalComment: updatePayload.internalComment }
            : {}),
          ...(updatePayload.hubStatus !== undefined ? { hubStatus: updatePayload.hubStatus } : {}),
        },
      });
      updated++;
      lines.push({ line: lineNumber, status: "updated", patientId: match.id });
    }
  });

  await writeActivityLog({
    actor: params.actorName,
    message: `Import CSV patients : ${created} crees, ${updated} mis a jour, ${skipped} ignores, ${errors} erreurs.`,
  });

  return {
    created,
    updated,
    skipped,
    errors,
    lines,
  };
}
