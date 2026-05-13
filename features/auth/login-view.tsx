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
  variant: "on-dark" | "on-light";
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
      : "bg-slate-900 text-white shadow-lg shadow-indigo-900/30 ring-1 ring-white/10 hover:bg-slate-800 hover:shadow-indigo-500/25 focus-visible:ring-offset-white";

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
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }

      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_FLAG_KEY, "1");
          localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
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
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
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

      {/* Panneau branding — desktop */}
      <aside className="relative z-0 hidden flex-col justify-between border-white/10 bg-gradient-to-br from-slate-900/95 via-indigo-950/90 to-slate-900 p-10 text-white lg:flex lg:border-r">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />
        </div>
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <InteractiveToothLogoButton size="lg" variant="on-dark" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/90">OrthoPilot</p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-white">OrthoPilot</h1>
            </div>
          </div>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-300">
            Plateforme de gestion du cabinet dentaire — outils internes, dossiers patients et coordination
            d&apos;équipe.
          </p>
        </div>
        <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
            <p className="text-xs leading-relaxed text-slate-200">
              Sécurisé. Fiable. Conçu pour les cabinets dentaires modernes.
            </p>
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
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-200/90 bg-white/90 py-3 pl-11 pr-3 text-sm text-slate-900 shadow-inner shadow-slate-900/5 outline-none ring-0 transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                    placeholder="Votre email"
                    required
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
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
