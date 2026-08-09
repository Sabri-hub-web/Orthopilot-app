import type { AuthUser } from "@/lib/auth/session";
import type { AppPermission } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import { roleLabel } from "@/lib/auth/roles";

export type SettingsTab =
  | "general"
  | "users"
  | "roles"
  | "notifications"
  | "integrations"
  | "security"
  | "backups"
  | "billing";

export const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "general", label: "Général" },
  { id: "users", label: "Utilisateurs" },
  { id: "roles", label: "Rôles & accès" },
  { id: "notifications", label: "Notifications" },
  { id: "integrations", label: "Intégrations" },
  { id: "security", label: "Sécurité" },
  { id: "backups", label: "Sauvegardes" },
  { id: "billing", label: "Facturation" },
];

export type PermissionModule =
  | "Patients"
  | "Emails"
  | "Règlements"
  | "Tâches"
  | "Documents"
  | "Logs"
  | "Paramètres";

export type PermissionAction = "view" | "create" | "update" | "delete";

export const PERMISSION_MODULES: PermissionModule[] = [
  "Patients",
  "Emails",
  "Règlements",
  "Tâches",
  "Documents",
  "Logs",
  "Paramètres",
];

export const DISPLAY_ROLES: AuthUser["role"][] = [
  "RESPONSABLE",
  "SECRETAIRE",
  "ASSISTANTE",
  "PRATICIEN",
];

const MODULE_PERMISSION_MAP: Record<
  PermissionModule,
  Partial<Record<PermissionAction, AppPermission | AppPermission[]>>
> = {
  Patients: {
    view: "patients:view",
    create: "patients:create",
    update: "patients:update",
    delete: "patients:update",
  },
  Emails: {
    view: "emails:view",
    create: "emails:manage",
    update: "emails:manage",
    delete: "emails:manage",
  },
  Règlements: {
    view: "reglements:view",
    create: "reglements:manage",
    update: "reglements:manage",
    delete: "reglements:manage",
  },
  Tâches: {
    view: "tasks:view",
    create: "tasks:manage",
    update: "tasks:manage",
    delete: "tasks:manage",
  },
  Documents: {
    view: "patients:view",
    create: "patients:comment",
    update: "patients:comment",
    delete: "patients:update",
  },
  Logs: {
    view: "logs:view",
    create: "logs:view",
    update: "logs:view",
    delete: "logs:view",
  },
  Paramètres: {
    view: "settings:view",
    create: "settings:view",
    update: "settings:view",
    delete: "settings:view",
  },
};

export function roleHasModuleAction(
  role: AuthUser["role"],
  module: PermissionModule,
  action: PermissionAction,
): boolean {
  const perm = MODULE_PERMISSION_MAP[module][action];
  if (!perm) return false;
  if (Array.isArray(perm)) return perm.some((p) => hasPermission(role, p));
  return hasPermission(role, perm);
}

export function roleDisplayLabel(role: AuthUser["role"]): string {
  if (role === "ADMIN") return "Administrateur";
  return roleLabel(role);
}

export interface NotificationPrefs {
  emailAssigned: boolean;
  emailUrgent: boolean;
  newPatient: boolean;
  paymentLate: boolean;
  relanceDue: boolean;
  taskAssigned: boolean;
  taskDueSoon: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailAssigned: true,
  emailUrgent: true,
  newPatient: true,
  paymentLate: true,
  relanceDue: true,
  taskAssigned: true,
  taskDueSoon: true,
};

export const NOTIFICATION_STORAGE_KEY = "orthopilot_notification_prefs";
export const GENERAL_SETTINGS_STORAGE_KEY = "orthopilot_general_settings";

export interface GeneralSettingsPrefs {
  cabinetName: string;
  logoDataUrl: string | null;
  phone: string;
  email: string;
  address: string;
}

export const THEME_STORAGE_KEY = "orthopilot_theme";
export type AppTheme = "light" | "dark";

export function loadTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function saveTheme(theme: AppTheme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.dispatchEvent(new CustomEvent("orthopilot-theme-changed", { detail: theme }));
}

export function loadNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(prefs));
}

export function loadGeneralSettings(): GeneralSettingsPrefs {
  const envName =
    typeof process.env.NEXT_PUBLIC_CABINET_DISPLAY_NAME === "string" &&
    process.env.NEXT_PUBLIC_CABINET_DISPLAY_NAME.trim() !== ""
      ? process.env.NEXT_PUBLIC_CABINET_DISPLAY_NAME.trim()
      : "Cabinet Hippolyte";
  const defaults: GeneralSettingsPrefs = {
    cabinetName: envName,
    logoDataUrl: null,
    phone: "",
    email: "",
    address: "",
  };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(GENERAL_SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<GeneralSettingsPrefs>;
    return {
      cabinetName: parsed.cabinetName ?? envName,
      logoDataUrl: parsed.logoDataUrl ?? null,
      phone: parsed.phone ?? "",
      email: parsed.email ?? "",
      address: parsed.address ?? "",
    };
  } catch {
    return defaults;
  }
}

export function saveGeneralSettings(prefs: GeneralSettingsPrefs) {
  localStorage.setItem(GENERAL_SETTINGS_STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent("orthopilot-cabinet-changed", { detail: prefs }));
}

export function userInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function presenceStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DISPONIBLE: "Actif",
    EN_CONSULTATION: "En consultation",
    EN_REUNION: "En réunion",
    ABSENT: "Inactif",
  };
  return map[status] ?? "Actif";
}
