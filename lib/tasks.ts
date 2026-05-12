export const TASK_STATUS_VALUES = ["A_FAIRE", "EN_COURS", "EN_ATTENTE", "TERMINEE"] as const;
export const TASK_PRIORITY_VALUES = ["FAIBLE", "NORMALE", "IMPORTANTE", "URGENTE"] as const;

export const taskStatusLabelMap = {
  A_FAIRE: "A faire",
  EN_COURS: "En cours",
  BLOQUEE: "En attente",
  EN_ATTENTE: "En attente",
  TERMINEE: "Terminee",
} as const;

export const taskPriorityLabelMap = {
  FAIBLE: "faible",
  NORMALE: "normale",
  IMPORTANTE: "importante",
  URGENTE: "urgente",
} as const;

export type TaskStatusValue = (typeof TASK_STATUS_VALUES)[number];
export type TaskPriorityValue = (typeof TASK_PRIORITY_VALUES)[number];
