"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Cloud,
  CreditCard,
  Database,
  Download,
  HardDrive,
  KeyRound,
  Lock,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import {
  DEFAULT_NOTIFICATION_PREFS,
  DISPLAY_ROLES,
  loadGeneralSettings,
  loadNotificationPrefs,
  NOTIFICATION_STORAGE_KEY,
  PERMISSION_MODULES,
  presenceStatusLabel,
  roleDisplayLabel,
  roleHasModuleAction,
  saveGeneralSettings,
  saveNotificationPrefs,
  SETTINGS_TABS,
  type GeneralSettingsPrefs,
  type NotificationPrefs,
  type PermissionAction,
  type SettingsTab,
  userInitials,
} from "@/lib/settings-ui";
import type { AuthUser } from "@/lib/auth/session";
import type { GmailConnectionStatus, SettingsOverviewResponse, SettingsUserItem } from "@/types/domain";

function frDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description ? <span className="block text-xs text-slate-500">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-violet-600" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-5" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [data, setData] = useState<SettingsOverviewResponse | null>(null);
  const [users, setUsers] = useState<SettingsUserItem[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [general, setGeneral] = useState<GeneralSettingsPrefs>({ cabinetName: "", logoDataUrl: null });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);

  const [gmailSyncing, setGmailSyncing] = useState(false);
  const [localGmail, setLocalGmail] = useState<GmailConnectionStatus | null>(null);

  const [userModal, setUserModal] = useState<"add" | "edit" | "reset" | null>(null);
  const [selectedUser, setSelectedUser] = useState<SettingsUserItem | null>(null);
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    role: "SECRETAIRE" as SettingsUserItem["role"],
    password: "",
    newPassword: "",
  });

  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordModal, setPasswordModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [backupMeta, setBackupMeta] = useState({ lastAt: null as string | null, total: 0 });

  const canManageUsers = currentUser?.role === "ADMIN" || currentUser?.role === "RESPONSABLE";

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  useEffect(() => {
    setGeneral(loadGeneralSettings());
    setNotifications(loadNotificationPrefs());
    try {
      const raw = localStorage.getItem("orthopilot_backup_meta");
      if (raw) setBackupMeta(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const loadAll = useCallback(async () => {
    const [settingsRes, usersRes, meRes] = await Promise.all([
      fetch("/api/settings", { cache: "no-store" }),
      fetch("/api/users", { cache: "no-store" }),
      fetch("/api/auth/me", { cache: "no-store" }),
    ]);
    if (!settingsRes.ok) throw new Error("Echec du chargement des paramètres.");
    const settingsPayload: SettingsOverviewResponse = await settingsRes.json();
    setData(settingsPayload);
    setLocalGmail(settingsPayload.gmail ?? null);
    if (usersRes.ok) {
      const usersPayload = await usersRes.json();
      setUsers(usersPayload.items ?? []);
    }
    if (meRes.ok) {
      const mePayload = await meRes.json();
      setCurrentUser(mePayload.user ?? null);
    }
  }, []);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        await loadAll();
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue.");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [loadAll]);

  function markDirty() {
    setDirty(true);
  }

  function handleLogoFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null;
      setLogoPreview(url);
      markDirty();
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      const nextGeneral = {
        cabinetName: general.cabinetName,
        logoDataUrl: logoPreview ?? general.logoDataUrl,
      };
      saveGeneralSettings(nextGeneral);
      setGeneral(nextGeneral);
      saveNotificationPrefs(notifications);
      setDirty(false);
      setSuccess("Paramètres enregistrés avec succès.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGmailSync() {
    try {
      setGmailSyncing(true);
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      const payload = await res.json();
      setLocalGmail(payload.status ?? null);
      await loadAll();
      setSuccess("Synchronisation Gmail terminée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur synchronisation.");
    } finally {
      setGmailSyncing(false);
    }
  }

  function openAddUser() {
    setUserForm({ fullName: "", email: "", role: "SECRETAIRE", password: "", newPassword: "" });
    setUserModal("add");
  }

  function openEditUser(user: SettingsUserItem) {
    setSelectedUser(user);
    setUserForm({ fullName: user.fullName, email: user.email, role: user.role, password: "", newPassword: "" });
    setUserModal("edit");
  }

  function openResetUser(user: SettingsUserItem) {
    setSelectedUser(user);
    setUserForm({ fullName: user.fullName, email: user.email, role: user.role, password: "", newPassword: "" });
    setUserModal("reset");
  }

  async function handleUserSubmit() {
    try {
      setError(null);
      if (userModal === "add") {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: userForm.fullName,
            email: userForm.email,
            role: userForm.role,
            password: userForm.password,
          }),
        });
        if (!res.ok) {
          setError(await errorMessageFromResponse(res));
          return;
        }
        setSuccess("Utilisateur ajouté.");
      } else if (userModal === "edit" && selectedUser) {
        const res = await fetch(`/api/users/${selectedUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: userForm.fullName, role: userForm.role }),
        });
        if (!res.ok) {
          setError(await errorMessageFromResponse(res));
          return;
        }
        setSuccess("Utilisateur mis à jour.");
      } else if (userModal === "reset" && selectedUser) {
        const res = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: userForm.newPassword }),
        });
        if (!res.ok) {
          setError(await errorMessageFromResponse(res));
          return;
        }
        setSuccess("Mot de passe réinitialisé.");
      }
      setUserModal(null);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur utilisateur.");
    }
  }

  async function handleDisableUser(user: SettingsUserItem) {
    if (!window.confirm(`Désactiver ${user.fullName} ?`)) return;
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presenceStatus: "ABSENT" }),
    });
    if (!res.ok) {
      setError(await errorMessageFromResponse(res));
      return;
    }
    setSuccess(`${user.fullName} désactivé.`);
    await loadAll();
  }

  async function handleChangePassword() {
    if (passwordForm.next !== passwordForm.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.next }),
    });
    if (!res.ok) {
      setError(await errorMessageFromResponse(res));
      return;
    }
    setPasswordModal(false);
    setPasswordForm({ current: "", next: "", confirm: "" });
    setSuccess("Mot de passe modifié.");
  }

  async function handleRevokeSessions() {
    const res = await fetch("/api/auth/sessions/revoke-all", { method: "POST" });
    if (!res.ok) {
      setError(await errorMessageFromResponse(res));
      return;
    }
    setSuccess("Tous les autres appareils ont été déconnectés.");
    await loadAll();
  }

  async function handleBackupNow() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orthopilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const meta = { lastAt: new Date().toISOString(), total: backupMeta.total + 1 };
    setBackupMeta(meta);
    localStorage.setItem("orthopilot_backup_meta", JSON.stringify(meta));
    setSuccess("Sauvegarde téléchargée.");
  }

  async function handleExportAll() {
    const endpoints = ["/api/settings", "/api/patients?page=1&pageSize=50", "/api/tasks?page=1&pageSize=50"];
    const results: Record<string, unknown> = {};
    for (const ep of endpoints) {
      const res = await fetch(ep, { cache: "no-store" });
      if (res.ok) results[ep] = await res.json();
    }
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orthopilot-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess("Export des données terminé.");
  }

  const displayLogo = logoPreview ?? general.logoDataUrl;
  const gmail = localGmail ?? data?.gmail;
  const showStickySave = dirty && (activeTab === "general" || activeTab === "notifications");

  const permissionActions: PermissionAction[] = ["view", "create", "update", "delete"];
  const actionLabels: Record<PermissionAction, string> = {
    view: "Voir",
    create: "Créer",
    update: "Modifier",
    delete: "Supprimer",
  };

  const kpiModules = useMemo(() => data?.modules ?? [], [data]);

  return (
    <div className="space-y-4 pb-24">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Paramètres</h2>
        <p className="text-sm text-slate-500">Console d&apos;administration du cabinet.</p>
      </div>

      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{success}</p>
      ) : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {/* Tabs */}
      <section className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeTab === tab.id
                  ? "border-b-2 border-violet-600 text-violet-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement des paramètres…</p>
      ) : (
        <>
          {/* Général */}
          {activeTab === "general" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Informations du cabinet</h3>
              <p className="mt-1 text-xs text-slate-500">Identité visuelle et nom affiché dans l&apos;application.</p>

              <div className="mt-4 grid gap-4 lg:grid-cols-[200px_1fr]">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {displayLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={displayLogo} alt="Logo cabinet" className="h-full w-full object-contain p-2" />
                    ) : (
                      <span className="text-4xl font-bold text-violet-600">OP</span>
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Upload className="h-3.5 w-3.5" />
                    Choisir un logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <p className="text-center text-[10px] text-slate-400">Prévisualisation avant enregistrement</p>
                </div>

                <div className="space-y-3">
                  <label className="flex flex-col gap-1 text-xs text-slate-500">
                    Nom du cabinet
                    <input
                      value={general.cabinetName}
                      onChange={(e) => {
                        setGeneral((p) => ({ ...p, cabinetName: e.target.value }));
                        markDirty();
                      }}
                      className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-800"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {kpiModules.slice(0, 4).map((m) => (
                      <div key={m.name} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-500">{m.name}</p>
                        <p className="mt-1 text-xs font-medium text-emerald-700">{m.status}</p>
                      </div>
                    ))}
                  </div>
                  {data ? (
                    <p className="text-xs text-slate-500">
                      OrthoPilot v{data.appVersion} · {data.counts.patients} patients · {data.counts.emails} emails
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {/* Utilisateurs */}
          {activeTab === "users" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Équipe du cabinet</h3>
                  <p className="text-xs text-slate-500">Gérez les accès et les rôles.</p>
                </div>
                {canManageUsers ? (
                  <button
                    type="button"
                    onClick={openAddUser}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-3 text-sm font-semibold text-white shadow-sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    Ajouter un utilisateur
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {users.map((user) => (
                  <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-sm font-bold text-violet-700">
                        {userInitials(user.fullName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{user.fullName}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                            {roleDisplayLabel(user.role)}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                              user.presenceStatus === "ABSENT"
                                ? "border-slate-200 bg-slate-100 text-slate-500"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {presenceStatusLabel(user.presenceStatus)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {canManageUsers ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditUser(user)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3 w-3" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisableUser(user)}
                          disabled={user.presenceStatus === "ABSENT"}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                          Désactiver
                        </button>
                        <button
                          type="button"
                          onClick={() => openResetUser(user)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-xs text-amber-800"
                        >
                          <KeyRound className="h-3 w-3" />
                          Réinitialiser MDP
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* Rôles & accès */}
          {activeTab === "roles" ? (
            <section className="grid gap-3 lg:grid-cols-2">
              {DISPLAY_ROLES.map((role) => (
                <article key={role} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">{roleDisplayLabel(role)}</h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          <th className="pb-2 pr-2">Module</th>
                          {permissionActions.map((a) => (
                            <th key={a} className="px-1 pb-2 text-center">
                              {actionLabels[a]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PERMISSION_MODULES.map((module) => (
                          <tr key={module} className="border-t border-slate-100">
                            <td className="py-2 pr-2 font-medium text-slate-700">{module}</td>
                            {permissionActions.map((action) => (
                              <td key={action} className="px-1 py-2 text-center">
                                {roleHasModuleAction(role, module, action) ? (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </section>
          ) : null}

          {/* Notifications */}
          {activeTab === "notifications" ? (
            <section className="space-y-4">
              {[
                {
                  title: "Emails",
                  icon: Mail,
                  items: [
                    { key: "emailAssigned" as const, label: "Email assigné", desc: "Quand un email vous est assigné" },
                    { key: "emailUrgent" as const, label: "Email urgent", desc: "Alertes sur les emails urgents" },
                  ],
                },
                {
                  title: "Patients",
                  icon: Users,
                  items: [{ key: "newPatient" as const, label: "Nouveau patient", desc: "Création d'un nouveau dossier" }],
                },
                {
                  title: "Règlements",
                  icon: CreditCard,
                  items: [
                    { key: "paymentLate" as const, label: "Retard paiement", desc: "Règlement en retard détecté" },
                    { key: "relanceDue" as const, label: "Relance à effectuer", desc: "Relance de paiement due" },
                  ],
                },
                {
                  title: "Tâches",
                  icon: Bell,
                  items: [
                    { key: "taskAssigned" as const, label: "Nouvelle tâche assignée", desc: "Tâche assignée à vous" },
                    { key: "taskDueSoon" as const, label: "Échéance proche", desc: "Rappel avant échéance tâche" },
                  ],
                },
              ].map((group) => (
                <article key={group.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <group.icon className="h-4 w-4 text-violet-600" />
                    {group.title}
                  </h3>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <Toggle
                        key={item.key}
                        checked={notifications[item.key]}
                        label={item.label}
                        description={item.desc}
                        onChange={(v) => {
                          setNotifications((p) => ({ ...p, [item.key]: v }));
                          markDirty();
                        }}
                      />
                    ))}
                  </div>
                </article>
              ))}
              <p className="text-xs text-slate-400">
                Préférences enregistrées localement. Les notifications système existantes restent actives côté serveur.
              </p>
            </section>
          ) : null}

          {/* Intégrations */}
          {activeTab === "integrations" ? (
            <section className="space-y-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <Mail className="h-4 w-4 text-violet-600" />
                      Gmail
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {gmail?.connected ? `Connecté · ${gmail.gmailEmail}` : "Non connecté"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      gmail?.connected
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {gmail?.connected ? "Connecté" : "Déconnecté"}
                  </span>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <dt className="text-[11px] text-slate-500">Dernière sync</dt>
                    <dd className="font-medium text-slate-800">{frDateTime(gmail?.lastSyncAt)}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <dt className="text-[11px] text-slate-500">Dernier import</dt>
                    <dd className="font-medium text-slate-800">{gmail?.lastSyncCount ?? 0} email(s)</dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <dt className="text-[11px] text-slate-500">Total importés</dt>
                    <dd className="font-medium text-slate-800">{gmail?.importedTotal ?? 0}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href="/api/gmail/connect"
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 text-xs font-medium text-violet-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {gmail?.connected ? "Reconnecter" : "Connecter Gmail"}
                  </a>
                  <button
                    type="button"
                    onClick={handleGmailSync}
                    disabled={!gmail?.connected || gmailSyncing}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 disabled:opacity-40"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${gmailSyncing ? "animate-spin" : ""}`} />
                    Synchroniser
                  </button>
                </div>
              </article>

              {[
                { name: "OpenAI", icon: Sparkles, desc: "Résumés IA des emails" },
                { name: "Supabase Storage", icon: Cloud, desc: "Stockage documents patients" },
              ].map((item) => (
                <article key={item.name} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500">
                      Bientôt disponible
                    </span>
                  </div>
                </article>
              ))}
            </section>
          ) : null}

          {/* Sécurité */}
          {activeTab === "security" ? (
            <section className="space-y-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <Shield className="h-4 w-4 text-violet-600" />
                  Sessions & connexion
                </h3>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <dt className="text-[11px] text-slate-500">Dernière connexion</dt>
                    <dd className="font-medium text-slate-800">{frDateTime(data?.security?.lastLoginAt)}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <dt className="text-[11px] text-slate-500">Sessions actives</dt>
                    <dd className="font-medium text-slate-800">{data?.security?.activeSessions ?? 0}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordModal(true)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Changer mot de passe
                  </button>
                  <button
                    type="button"
                    onClick={handleRevokeSessions}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-700"
                  >
                    Déconnecter tous les appareils
                  </button>
                </div>
              </article>
              <article className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Double authentification</p>
                    <p className="text-xs text-slate-500">Sécurité renforcée pour les comptes admin.</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500">
                    Bientôt disponible
                  </span>
                </div>
              </article>
            </section>
          ) : null}

          {/* Sauvegardes */}
          {activeTab === "backups" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Database className="h-4 w-4 text-violet-600" />
                Sauvegardes
              </h3>
              <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-[11px] text-slate-500">Dernière sauvegarde</dt>
                  <dd className="font-medium text-slate-800">{frDateTime(backupMeta.lastAt)}</dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-[11px] text-slate-500">Total sauvegardes</dt>
                  <dd className="font-medium text-slate-800">{backupMeta.total}</dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-[11px] text-slate-500">Taille estimée</dt>
                  <dd className="font-medium text-slate-800">{data?.backups?.estimatedSizeMb ?? 0} Mo</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBackupNow}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white"
                >
                  <HardDrive className="h-3.5 w-3.5" />
                  Sauvegarder maintenant
                </button>
                <button
                  type="button"
                  onClick={handleBackupNow}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Télécharger sauvegarde
                </button>
              </div>
            </section>
          ) : null}

          {/* Facturation */}
          {activeTab === "billing" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <CreditCard className="h-4 w-4 text-violet-600" />
                Abonnement
              </h3>
              <div className="mt-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-4">
                <p className="text-xs text-slate-500">Plan actuel</p>
                <p className="text-xl font-bold text-slate-900">{data?.billing?.plan ?? "OrthoPilot Pro"}</p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Stockage utilisé</p>
                  <p className="text-lg font-bold text-slate-900">{data?.billing?.storageUsedMb ?? 0} Mo</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Documents stockés</p>
                  <p className="text-lg font-bold text-slate-900">{data?.billing?.documentsStored ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Emails synchronisés</p>
                  <p className="text-lg font-bold text-slate-900">{data?.billing?.emailsSynced ?? 0}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">Interface préparée pour la future facturation en ligne.</p>
            </section>
          ) : null}
        </>
      )}

      {/* Zone dangereuse */}
      <section className="rounded-2xl border border-red-200 bg-red-50/40 p-4 shadow-sm">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-red-800">
          <AlertTriangle className="h-4 w-4" />
          Zone dangereuse
        </h3>
        <p className="mt-1 text-xs text-red-700/80">Actions irréversibles. Procédez avec prudence.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportAll}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700"
          >
            <Download className="h-3.5 w-3.5" />
            Exporter toutes les données
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirm("");
              setDeleteModal(true);
            }}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-300 bg-white px-3 text-xs font-medium text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer le cabinet
          </button>
        </div>
      </section>

      {/* Sticky save */}
      {showStickySave ? (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-lg">
          <p className="text-sm text-slate-600">Modifications non enregistrées</p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      ) : null}

      {/* Modal utilisateur */}
      {userModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {userModal === "add" ? "Ajouter un utilisateur" : userModal === "edit" ? "Modifier l'utilisateur" : "Réinitialiser le mot de passe"}
              </h3>
              <button type="button" onClick={() => setUserModal(null)} className="rounded-lg border border-slate-200 p-1.5 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="space-y-3 p-4">
              {userModal !== "reset" ? (
                <>
                  <input
                    value={userForm.fullName}
                    onChange={(e) => setUserForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Nom complet"
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  />
                  {userModal === "add" ? (
                    <input
                      value={userForm.email}
                      onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="Email"
                      type="email"
                      className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    />
                  ) : null}
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value as SettingsUserItem["role"] }))}
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  >
                    {(["RESPONSABLE", "SECRETAIRE", "ASSISTANTE", "PRATICIEN"] as const).map((r) => (
                      <option key={r} value={r}>
                        {roleDisplayLabel(r)}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
              {userModal === "add" ? (
                <input
                  value={userForm.password}
                  onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Mot de passe (8 car. min.)"
                  type="password"
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              ) : null}
              {userModal === "reset" ? (
                <input
                  value={userForm.newPassword}
                  onChange={(e) => setUserForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Nouveau mot de passe"
                  type="password"
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              ) : null}
              <button
                type="button"
                onClick={handleUserSubmit}
                className="w-full rounded-xl bg-violet-600 py-2 text-sm font-semibold text-white"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal mot de passe */}
      {passwordModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Changer le mot de passe</h3>
              <button type="button" onClick={() => setPasswordModal(false)} className="rounded-lg border border-slate-200 p-1.5 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="space-y-3 p-4">
              <input
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                placeholder="Mot de passe actuel"
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
              <input
                type="password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
                placeholder="Nouveau mot de passe"
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Confirmer"
                className="h-9 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
              <button type="button" onClick={handleChangePassword} className="w-full rounded-xl bg-violet-600 py-2 text-sm font-semibold text-white">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal suppression cabinet */}
      {deleteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white shadow-xl">
            <header className="border-b border-red-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-red-800">Supprimer le cabinet</h3>
              <p className="mt-1 text-xs text-red-600">Cette action est définitive et irréversible.</p>
            </header>
            <div className="space-y-3 p-4">
              <p className="text-sm text-slate-600">
                Tapez <strong>SUPPRIMER</strong> pour confirmer.
              </p>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="SUPPRIMER"
                className="h-9 w-full rounded-xl border border-red-200 px-3 text-sm"
              />
              <button
                type="button"
                disabled={deleteConfirm !== "SUPPRIMER"}
                onClick={() => {
                  setDeleteModal(false);
                  setError("Suppression du cabinet non activée en production. Contactez l'administrateur.");
                }}
                className="w-full rounded-xl bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
