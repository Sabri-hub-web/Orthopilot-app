export const EMAIL_CATEGORY_VALUES = ["URGENT", "ADMINISTRATIF", "SUIVI_CLINIQUE"] as const;

export const emailCategoryLabelMap = {
  URGENT: "Urgent",
  ADMINISTRATIF: "Administratif",
  SUIVI_CLINIQUE: "Suivi clinique",
} as const;

export const EMAIL_STATUS_VALUES = ["A_TRAITER", "EN_COURS", "TRAITE", "ARCHIVE"] as const;

export const emailStatusLabelMap = {
  A_TRAITER: "A traiter",
  EN_COURS: "En cours",
  TRAITE: "Traite",
  ARCHIVE: "Archive",
} as const;

export type EmailCategoryValue = (typeof EMAIL_CATEGORY_VALUES)[number];
export type EmailStatusValue = (typeof EMAIL_STATUS_VALUES)[number];
