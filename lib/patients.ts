export const PATIENT_HUB_STATUS_VALUES = ["ACTIF", "ATTENTION_ADMIN", "ARCHIVE"] as const;

export const patientHubStatusLabelMap = {
  ACTIF: "Actif",
  ATTENTION_ADMIN: "Suivi admin",
  ARCHIVE: "Archive",
} as const;

export type PatientHubStatusValue = (typeof PATIENT_HUB_STATUS_VALUES)[number];
