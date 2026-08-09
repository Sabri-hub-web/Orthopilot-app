"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Moon, Palette, Save, Sun, UserRound } from "lucide-react";
import {
  loadGeneralSettings,
  loadTheme,
  saveGeneralSettings,
  saveTheme,
  type AppTheme,
  type GeneralSettingsPrefs,
} from "@/lib/settings-ui";

type SettingsTab = "profil" | "apparence" | "cabinet";

const TABS: { id: SettingsTab; label: string; icon: typeof UserRound }[] = [
  { id: "profil", label: "Profil", icon: UserRound },
  { id: "apparence", label: "Apparence", icon: Palette },
  { id: "cabinet", label: "Cabinet", icon: Building2 },
];

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "—", lastName: "—" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "—" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profil");
  const [profile, setProfile] = useState<{ fullName: string; email: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [theme, setThemeState] = useState<AppTheme>("light");
  const [cabinet, setCabinet] = useState<GeneralSettingsPrefs>(() => ({
    cabinetName: "",
    logoDataUrl: null,
    phone: "",
    email: "",
    address: "",
  }));
  const [cabinetDirty, setCabinetDirty] = useState(false);
  const [savingCabinet, setSavingCabinet] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setThemeState(loadTheme());
    setCabinet(loadGeneralSettings());
  }, []);

  useEffect(() => {
    async function loadMe() {
      try {
        setLoadingProfile(true);
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const user = data.user ?? data;
        setProfile({
          fullName: user.fullName ?? "",
          email: user.email ?? "",
        });
      } finally {
        setLoadingProfile(false);
      }
    }
    void loadMe();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 3000);
    return () => window.clearTimeout(t);
  }, [success]);

  const nameParts = useMemo(
    () => splitFullName(profile?.fullName ?? ""),
    [profile?.fullName],
  );

  function handleThemeToggle(next: AppTheme) {
    setThemeState(next);
    saveTheme(next);
    setSuccess(next === "dark" ? "Mode sombre activé." : "Mode clair activé.");
  }

  function patchCabinet(patch: Partial<GeneralSettingsPrefs>) {
    setCabinet((prev) => ({ ...prev, ...patch }));
    setCabinetDirty(true);
  }

  function handleSaveCabinet() {
    setSavingCabinet(true);
    try {
      saveGeneralSettings(cabinet);
      setCabinetDirty(false);
      setSuccess("Informations du cabinet enregistrées.");
    } finally {
      setSavingCabinet(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-20">
      <header>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Paramètres</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Profil, apparence et informations du cabinet.
        </p>
      </header>

      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          {success}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
              activeTab === id
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "profil" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Profil</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Informations de votre compte connecté.
          </p>
          {loadingProfile ? (
            <p className="mt-4 text-sm text-slate-500">Chargement…</p>
          ) : (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Prénom</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {nameParts.firstName}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Nom</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {nameParts.lastName}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 sm:col-span-2 dark:border-slate-700 dark:bg-slate-800/60">
                <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Email</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {profile?.email || "—"}
                </dd>
              </div>
            </dl>
          )}
        </section>
      ) : null}

      {activeTab === "apparence" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Apparence</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Basculez entre le mode clair et le mode sombre. Le choix est mémorisé sur cet appareil.
          </p>
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-violet-500" />
              ) : (
                <Sun className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {theme === "dark" ? "Mode sombre" : "Mode clair"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {theme === "dark" ? "Interface assombrie pour le confort nocturne." : "Interface claire par défaut."}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              onClick={() => handleThemeToggle(theme === "dark" ? "light" : "dark")}
              className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                theme === "dark" ? "bg-violet-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                  theme === "dark" ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
        </section>
      ) : null}

      {activeTab === "cabinet" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cabinet</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Nom et coordonnées de base affichées dans OrthoPilot.
          </p>
          <div className="mt-4 grid gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              Nom du cabinet
              <input
                value={cabinet.cabinetName}
                onChange={(e) => patchCabinet({ cabinetName: e.target.value })}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Nom du cabinet"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              Téléphone
              <input
                value={cabinet.phone}
                onChange={(e) => patchCabinet({ phone: e.target.value })}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="01 23 45 67 89"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              Email cabinet
              <input
                type="email"
                value={cabinet.email}
                onChange={(e) => patchCabinet({ email: e.target.value })}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="contact@cabinet.fr"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              Adresse
              <textarea
                value={cabinet.address}
                onChange={(e) => patchCabinet({ address: e.target.value })}
                rows={2}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Adresse du cabinet"
              />
            </label>
          </div>
        </section>
      ) : null}

      {activeTab === "cabinet" && cabinetDirty ? (
        <div className="fixed bottom-4 left-1/2 z-40 w-[min(100%-2rem,42rem)] -translate-x-1/2">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-white px-4 py-3 shadow-lg dark:border-violet-800 dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-300">Modifications non enregistrées</p>
            <button
              type="button"
              onClick={handleSaveCabinet}
              disabled={savingCabinet}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {savingCabinet ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
