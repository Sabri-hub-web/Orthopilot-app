export const REGLEMENT_STATUS_VALUES = [
  "EN_ATTENTE",
  "EN_RETARD",
  "RELANCE_ENVOYEE",
  "PARTIEL",
  "REGLE",
] as const;

export const reglementStatusLabelMap = {
  EN_ATTENTE: "En attente",
  EN_RETARD: "En retard",
  RELANCE_ENVOYEE: "Relance envoyee",
  PARTIEL: "Partiel",
  REGLE: "Regle",
} as const;

export type ReglementStatusValue = (typeof REGLEMENT_STATUS_VALUES)[number];

export const REGLEMENT_SEMESTRE_VALUES = [
  "SEMESTRE_1",
  "SEMESTRE_2",
  "SEMESTRE_3",
  "SEMESTRE_4",
  "CONTENTION",
  "HORS_SEMESTRE",
] as const;

export const reglementSemestreLabelMap = {
  SEMESTRE_1: "Semestre 1",
  SEMESTRE_2: "Semestre 2",
  SEMESTRE_3: "Semestre 3",
  SEMESTRE_4: "Semestre 4",
  CONTENTION: "Contention",
  HORS_SEMESTRE: "Hors semestre / Autre",
} as const;

export type ReglementSemestreValue = (typeof REGLEMENT_SEMESTRE_VALUES)[number];

export function reglementSemestreLabel(value: ReglementSemestreValue | null | undefined): string {
  if (!value) return reglementSemestreLabelMap.HORS_SEMESTRE;
  return reglementSemestreLabelMap[value];
}
