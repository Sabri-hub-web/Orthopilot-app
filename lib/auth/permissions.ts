import type { AuthUser } from "@/lib/auth/session";

export type AppPermission =
  | "dashboard:view"
  | "patients:view"
  | "patients:create"
  | "patients:update"
  | "patients:import"
  | "patients:comment"
  | "tasks:view"
  | "tasks:manage"
  | "emails:view"
  | "emails:manage"
  | "reglements:view"
  | "reglements:manage"
  | "logs:view"
  | "settings:view"
  | "users:view"
  | "presence:view"
  | "calendar:view"
  | "calendar:manage"
  | "messages:view"
  | "messages:send";

const rolePermissions: Record<AuthUser["role"], Set<AppPermission>> = {
  ADMIN: new Set<AppPermission>([
    "dashboard:view",
    "patients:view",
    "patients:create",
    "patients:update",
    "patients:import",
    "patients:comment",
    "tasks:view",
    "tasks:manage",
    "emails:view",
    "emails:manage",
    "reglements:view",
    "reglements:manage",
    "logs:view",
    "settings:view",
    "users:view",
    "presence:view",
    "calendar:view",
    "calendar:manage",
    "messages:view",
    "messages:send",
  ]),
  RESPONSABLE: new Set<AppPermission>([
    "dashboard:view",
    "patients:view",
    "patients:create",
    "patients:update",
    "patients:import",
    "patients:comment",
    "tasks:view",
    "tasks:manage",
    "emails:view",
    "emails:manage",
    "reglements:view",
    "reglements:manage",
    "logs:view",
    "settings:view",
    "users:view",
    "presence:view",
    "calendar:view",
    "calendar:manage",
    "messages:view",
    "messages:send",
  ]),
  SECRETAIRE: new Set<AppPermission>([
    "dashboard:view",
    "patients:view",
    "patients:create",
    "patients:update",
    "patients:import",
    "patients:comment",
    "tasks:view",
    "tasks:manage",
    "emails:view",
    "emails:manage",
    "reglements:view",
    "reglements:manage",
    "calendar:view",
    "calendar:manage",
    "messages:view",
    "messages:send",
  ]),
  PRATICIEN: new Set<AppPermission>([
    "dashboard:view",
    "patients:view",
    "patients:comment",
    "tasks:view",
    "calendar:view",
    "messages:view",
    "messages:send",
  ]),
  ASSISTANTE: new Set<AppPermission>([
    "dashboard:view",
    "patients:view",
    "patients:comment",
    "tasks:view",
    "emails:view",
    "reglements:view",
    "calendar:view",
    "messages:view",
    "messages:send",
  ]),
};

/** Accès unifié : tous les utilisateurs connectés ont les mêmes droits (niveau ADMIN). */
export function hasPermission(_role: AuthUser["role"], permission: AppPermission): boolean {
  return rolePermissions.ADMIN.has(permission);
}

export function hasAnyPermission(role: AuthUser["role"], permissions: AppPermission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}
