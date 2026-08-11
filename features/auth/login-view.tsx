"use client";

import {
  AlertCircle,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
} from "lucide-react";
import { type AnimationEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";

const REMEMBER_EMAIL_KEY = "orthopilot_login_remember_email";
const REMEMBER_FLAG_KEY = "orthopilot_login_remember_me";

function CabinetToothLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="24" cy="24" r="22" fill="white" fillOpacity="0.12" />
      <path
        d="M24 10c-4.2 0-7 2.4-8.2 6.1-.6 2-.4 4.1.2 6 .5 1.6.4 3.2-.2 4.7-.8 2.1-.9 4.3-.2 6.4.5 1.6 1.7 2.8 3.3 3.2 1.1.3 2.3.1 3.3-.5 1.1-.7 2.5-.7 3.6 0 1 .6 1.7 1.5 2.1.9.4 2 .4 2.9 0 1.1-.5 1.8-1.5 2.1-1 .3-2.2.2-3.3-.5-1.6-1-2.8-1.6-3.3-3.2-.7-2.1-.6-4.3.2-6.4.6-1.5.7-3.1.2-4.7-.6-1.9-.8-4-.2-6C17 12.4 19.8 10 24 10Z"
        fill="white"
        fillOpacity="0.95"
      />
    </svg>
  );
}

/** Logo dent cliquable : léger mouvement au survol, animation au clic (respecte prefers-reduced-motion). */
function InteractiveToothLogoButton({
  size,
  variant,
}: {
  size: "lg" | "sm";
  variant: "on-dark" | "on-light" | "on-glass-blue";
}) {
  const [wiggle, setWiggle] = useState(false);
  const large = size === "lg";

  function playWiggle() {
    setWiggle(false);
    requestAnimationFrame(() => setWiggle(true));
  }

  function onWiggleEnd(event: AnimationEvent<HTMLButtonElement>) {
    if (event.animationName === "tooth-wiggle") {
      setWiggle(false);
    }
  }

  const base =
    "group relative flex shrink-0 cursor-pointer select-none items-center justify-center overflow-visible outline-none " +
    "transition-[transform,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] " +
    "motion-safe:hover:-translate-y-1.5 motion-safe:hover:rotate-[5deg] motion-safe:hover:scale-[1.06] " +
    "motion-safe:hover:shadow-xl motion-safe:active:translate-y-px motion-safe:active:scale-[0.96] motion-safe:active:rotate-0 " +
    "motion-reduce:hover:translate-y-0 motion-reduce:hover:rotate-0 motion-reduce:hover:scale-100 " +
    "focus-visible:ring-2 focus-visible:ring-indigo-400/90 focus-visible:ring-offset-2";

  const sizeBox = large ? "h-16 w-16 rounded-2xl" : "h-11 w-11 rounded-xl";

  const palette =
    variant === "on-dark"
      ? "bg-white/10 ring-1 ring-white/20 shadow-md shadow-black/25 backdrop-blur-sm hover:bg-white/18 hover:ring-white/35 hover:shadow-lg hover:shadow-cyan-400/10 focus-visible:ring-offset-slate-900"
      : variant === "on-light"
        ? "bg-slate-900 text-white shadow-lg shadow-indigo-900/30 ring-1 ring-white/10 hover:bg-slate-800 hover:shadow-indigo-500/25 focus-visible:ring-offset-white"
        : "bg-white/20 ring-1 ring-white/50 shadow-lg shadow-sky-950/25 backdrop-blur-md hover:bg-white/32 hover:ring-white/70 hover:shadow-sky-900/20 focus-visible:ring-offset-sky-700";

  const toothMotion =
    "pointer-events-none motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-110";

  return (
    <button
      type="button"
      aria-label="Logo OrthoPilot — dent stylisée"
      onClick={playWiggle}
      onAnimationEnd={onWiggleEnd}
      className={`${base} ${sizeBox} ${palette} ${
        wiggle ? "animate-tooth-wiggle motion-reduce:animate-none" : ""
      }`}
    >
      <CabinetToothLogo className={`${large ? "h-11 w-11" : "h-7 w-7"} ${toothMotion}`} />
    </button>
  );
}

/** Dent + anneau orbital (réf. maquette), le bouton interne garde hover / clic. */
function BrandToothWithOrbitalRing() {
  return (
    <div className="relative mx-auto flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center lg:mx-0">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full origin-center text-white/60 motion-safe:animate-login-orbit motion-reduce:animate-none"
        viewBox="0 0 88 88"
        fill="none"
        aria-hidden
      >
        <circle
          cx="44"
          cy="44"
          r="40"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeDasharray="26 132"
          opacity="0.92"
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center">
        <InteractiveToothLogoButton size="lg" variant="on-glass-blue" />
      </div>
    </div>
  );
}

export function LoginView() {
  const router = useRouter();
  const cabinetName =
    typeof process.env.NEXT_PUBLIC_CABINET_DISPLAY_NAME === "string" &&
    process.env.NEXT_PUBLIC_CABINET_DISPLAY_NAME.trim() !== ""
      ? process.env.NEXT_PUBLIC_CABINET_DISPLAY_NAME.trim()
      : "Cabinet Hippolyte";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(REMEMBER_FLAG_KEY) === "1";
        const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
        if (saved && savedEmail) {
          setRememberMe(true);
          setEmail(savedEmail);
        }
      } catch {
        /* ignore */
      }
    });
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Email et mot de passe requis.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }

      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_FLAG_KEY, "1");
          localStorage.setItem(REMEMBER_EMAIL_KEY, trimmedEmail);
        } else {
          localStorage.removeItem(REMEMBER_FLAG_KEY);
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        /* ignore */
      }

      router.replace("/");
      router.refresh();
    } catch (e) {
      console.error("[login] Erreur réseau / client:", e);
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de joindre le serveur. Vérifiez votre connexion.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen w-full overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Fond dégradé + formes floues */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-100 via-indigo-50 to-violet-100"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl"
        aria-hidden
      />

      {/* Panneau gauche — dégradé médical prolongé + plante (sans photo basse qualité) */}
      <aside className="relative z-0 hidden min-h-screen flex-col justify-between overflow-hidden border-sky-200/30 lg:flex lg:border-r">
        {/* Dégradé vertical : bleu dense en haut → même famille de teintes jusqu’au bas (pas de rupture nette) */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#075985_0%,#0369a1_14%,#0284c7_30%,#0ea5e9_48%,#38bdf8_66%,#7dd3fc_80%,#bae6fd_92%,#e0f2fe_100%)]"
          aria-hidden
        />
        {/* Halo derrière le logo */}
        <div
          className="pointer-events-none absolute left-1/2 top-28 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-300/35 blur-3xl"
          aria-hidden
        />
        {/* Décor végétal CSS (sans asset PNG local manquant) */}
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
          <svg
            className="absolute -bottom-8 -right-10 h-[70%] w-[85%] opacity-40 mix-blend-soft-light sm:opacity-50"
            viewBox="0 0 400 480"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="260" cy="420" rx="90" ry="28" fill="white" fillOpacity="0.15" />
            <path
              d="M250 420 C248 300 230 220 210 120"
              stroke="white"
              strokeOpacity="0.35"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M210 180 C150 150 120 100 140 60 C180 90 210 130 230 170"
              fill="white"
              fillOpacity="0.28"
            />
            <path
              d="M220 250 C280 210 330 180 350 140 C300 160 250 210 225 255"
              fill="white"
              fillOpacity="0.22"
            />
            <path
              d="M205 320 C140 300 90 270 70 220 C130 250 180 290 215 330"
              fill="white"
              fillOpacity="0.2"
            />
          </svg>
        </div>
        {/* Grille de points — coin haut droit */}
        <div
          className="pointer-events-none absolute right-0 top-0 z-[3] h-48 w-56 opacity-[0.18]"
          aria-hidden
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "14px 14px",
          }}
        />
        {/* Lignes ondulées discrètes */}
        <svg
          className="pointer-events-none absolute bottom-[20%] right-[-5%] z-[3] h-64 w-64 text-white/10"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden
        >
          <path
            d="M20 160c40-20 60-60 100-50s70 40 90 20"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.6"
          />
          <path
            d="M0 120c50-30 80-10 120-30s60-40 100-20"
            stroke="currentColor"
            strokeWidth="0.9"
            opacity="0.45"
          />
        </svg>

        <div className="relative z-10 flex flex-1 flex-col px-10 pb-10 pt-12">
          <div className="flex max-w-md flex-col items-center text-center lg:items-start lg:text-left">
            <BrandToothWithOrbitalRing />
            <h1 className="mt-8 text-3xl font-bold tracking-tight text-white drop-shadow-sm">OrthoPilot</h1>
            <p className="mt-3 text-[15px] font-medium leading-relaxed text-white/90">
              Plateforme de gestion du cabinet dentaire
            </p>
            <p className="mt-5 text-sm leading-relaxed text-white/75">
              Outils internes, dossiers patients et coordination d&apos;équipe.
            </p>
          </div>
          <div className="mt-auto w-full max-w-md pt-16">
            <div className="rounded-2xl border border-white/45 bg-white/25 p-4 shadow-lg shadow-sky-900/15 backdrop-blur-md">
              <div className="flex gap-3">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                <p className="text-xs font-medium leading-relaxed text-slate-800/90">
                  Sécurisé. Fiable. Conçu pour les cabinets dentaires modernes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Colonne formulaire */}
      <div className="relative z-10 flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
        {/* Branding compact mobile / tablette */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <InteractiveToothLogoButton size="sm" variant="on-light" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">OrthoPilot</p>
            <p className="text-sm font-semibold text-slate-800">Connexion sécurisée</p>
          </div>
        </div>

        <div className="animate-login-card-in mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-white/60 bg-white/85 p-8 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.18)] shadow-indigo-950/5 backdrop-blur-xl sm:p-9">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 lg:mx-0">
                <Building2 className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Cabinet dentaire
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{cabinetName}</h2>
              <p className="mt-2 text-sm text-slate-600">Bienvenue sur votre espace OrthoPilot</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {error ? (
                <div
                  role="alert"
                  className="flex gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm text-rose-900 shadow-sm backdrop-blur-sm"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden />
                  <p className="leading-snug">{error}</p>
                </div>
              ) : null}

              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Email
                </label>
                <div className="group relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500"
                    aria-hidden
                  />
                  <input
                    id="login-email"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    spellCheck={false}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 bg-white/90 py-3 pl-11 pr-3 text-sm text-slate-900 shadow-inner shadow-slate-900/5 outline-none ring-0 transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                    placeholder="ex. julie@cabinet.local"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Mot de passe
                </label>
                <div className="group relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500"
                    aria-hidden
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 bg-white/90 py-3 pl-11 pr-12 text-sm text-slate-900 shadow-inner shadow-slate-900/5 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                    placeholder="Votre mot de passe"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setShowPassword((v) => !v);
                    }}
                    className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                  />
                  <span>Se souvenir de moi</span>
                </label>
                <span
                  className="text-xs font-medium text-slate-400"
                  title="Contactez l'administrateur du cabinet pour réinitialiser votre accès."
                >
                  Mot de passe oublié ?
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              Vos données sont sécurisées et confidentielles.
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} OrthoPilot — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
