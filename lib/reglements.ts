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
