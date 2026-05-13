/** Parse CSV (RFC4180-like) avec séparateur , ou ; */

export type CsvCanonicalField =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "legalGuardian"
  | "nextAppointmentAt"
  | "mutuelle"
  | "internalComment"
  | "hubStatus";

/** Synonymes d’en-tête normalisés (sans accents, minuscules) → champ canonique */
const HEADER_TO_CANONICAL: Record<string, CsvCanonicalField> = {
  firstname: "firstName",
  prenom: "firstName",
  lastname: "lastName",
  nom: "lastName",
  nomfamille: "lastName",
  nomdenaissance: "lastName",
  email: "email",
  mail: "email",
  courriel: "email",
  telephone: "phone",
  tel: "phone",
  mobile: "phone",
  portable: "phone",
  phone: "phone",
  legalguardian: "legalGuardian",
  representantlegal: "legalGuardian",
  tuteur: "legalGuardian",
  nextappointmentat: "nextAppointmentAt",
  prochainrdv: "nextAppointmentAt",
  rdv: "nextAppointmentAt",
  datederdv: "nextAppointmentAt",
  mutuelle: "mutuelle",
  internalcomment: "internalComment",
  commentaire: "internalComment",
  comment: "internalComment",
  hubstatus: "hubStatus",
  statut: "hubStatus",
  statuthub: "hubStatus",
};

export function normalizeCsvHeader(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "");
}

export function mapHeaderToCanonical(raw: string): CsvCanonicalField | null {
  const k = normalizeCsvHeader(raw);
  return HEADER_TO_CANONICAL[k] ?? null;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === delimiter) {
        out.push(field);
        field = "";
      } else {
        field += c;
      }
    }
  }
  out.push(field);
  return out;
}

export function detectDelimiter(headerLine: string): string {
  const semi = (headerLine.match(/;/g) ?? []).length;
  const comma = (headerLine.match(/,/g) ?? []).length;
  return semi > comma ? ";" : ",";
}

export function splitCsvRows(text: string): string[] {
  const t = text.replace(/^\uFEFF/, "");
  const rows: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      cur += c;
    } else if (!inQuotes && (c === "\n" || (c === "\r" && t[i + 1] === "\n"))) {
      rows.push(cur);
      cur = "";
      if (c === "\r" && t[i + 1] === "\n") i++;
    } else if (!inQuotes && c === "\r") {
      rows.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  if (cur.length || rows.length) rows.push(cur);
  return rows.filter((r) => r.trim().length > 0);
}

export interface ParsedCsvTable {
  delimiter: string;
  headers: string[];
  canonicalHeaders: (CsvCanonicalField | null)[];
  /** Lignes du fichier (numero 1 = en-tete), avec champs bruts */
  rows: {
    lineNumber: number;
    raw: Record<CsvCanonicalField, string>;
    /** Colonnes réellement présentes dans le fichier (en-tête mappé) */
    presentFields: Set<CsvCanonicalField>;
  }[];
}

export function parsePatientCsv(text: string): ParsedCsvTable {
  const rowStrings = splitCsvRows(text);
  if (rowStrings.length === 0) {
    throw new Error("Fichier CSV vide.");
  }
  const delimiter = detectDelimiter(rowStrings[0]);
  const headerCells = parseCsvLine(rowStrings[0], delimiter);
  const canonicalHeaders = headerCells.map((h) => mapHeaderToCanonical(h));

  const rows: ParsedCsvTable["rows"] = [];
  for (let r = 1; r < rowStrings.length; r++) {
    const lineNumber = r + 1;
    const cells = parseCsvLine(rowStrings[r], delimiter);
    const row: Partial<Record<CsvCanonicalField, string>> = {};
    const presentFields = new Set<CsvCanonicalField>();
    for (let c = 0; c < canonicalHeaders.length; c++) {
      const field = canonicalHeaders[c];
      if (!field) continue;
      presentFields.add(field);
      row[field] = cells[c] ?? "";
    }
    const anyContent = Object.values(row).some((v) => typeof v === "string" && v.trim() !== "");
    if (!anyContent) continue;
    rows.push({
      lineNumber,
      raw: row as Record<CsvCanonicalField, string>,
      presentFields,
    });
  }

  return {
    delimiter,
    headers: headerCells,
    canonicalHeaders,
    rows,
  };
}
