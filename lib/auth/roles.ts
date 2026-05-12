import type { AuthUser } from "@/lib/auth/session";

const roleLabelMap: Record<AuthUser["role"], string> = {
  ADMIN: "Admin",
  RESPONSABLE: "Responsable",
  SECRETAIRE: "Secretaire",
  PRATICIEN: "Praticien",
  ASSISTANTE: "Assistante",
};

export function roleLabel(role: AuthUser["role"]): string {
  return roleLabelMap[role];
}
