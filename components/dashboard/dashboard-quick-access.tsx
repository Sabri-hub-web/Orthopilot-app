"use client";

import {
  Banknote,
  CreditCard,
  MessageSquare,
  Send,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

const shortcuts = [
  { label: "Nouveau patient", href: "/patients", icon: UserPlus, accent: "from-emerald-400/90 to-teal-500" },
  { label: "Nouvelle tâche", href: "/tasks", icon: Stethoscope, accent: "from-sky-400/90 to-blue-600" },
  { label: "Relance rapide", href: "/reglements", icon: CreditCard, accent: "from-amber-400/90 to-orange-500" },
  { label: "Envoyer email", href: "/emails", icon: Send, accent: "from-violet-400/90 to-indigo-600" },
  { label: "Règlement reçu", href: "/reglements", icon: Banknote, accent: "from-teal-400/90 to-emerald-600" },
  { label: "Commentaire patient", href: "/messages", icon: MessageSquare, accent: "from-slate-500/90 to-slate-700" },
];

export function DashboardQuickAccess({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="grid h-full min-h-0 grid-cols-2 grid-rows-3 gap-1.5">
        {shortcuts.map(({ label, href, icon: Icon, accent }) => (
          <Link
            key={label}
            href={href}
            title={label}
            className="group flex min-h-0 flex-col items-center justify-center gap-1 rounded-xl border border-slate-100 bg-slate-50/80 px-1 py-2 text-center transition hover:border-slate-200 hover:bg-white"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-white shadow-sm ring-2 ring-white/40`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.6} aria-hidden />
            </span>
            <span className="line-clamp-2 max-w-full px-0.5 text-[10px] font-medium leading-tight text-slate-700">
              {label}
            </span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {shortcuts.map(({ label, href, icon: Icon, accent }) => (
        <Link
          key={label}
          href={href}
          className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-3 py-5 text-center shadow-sm shadow-slate-900/5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md motion-reduce:transform-none"
        >
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm transition group-hover:scale-105 motion-reduce:transform-none`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
          </span>
          <span className="text-[12px] font-medium leading-tight text-slate-700">{label}</span>
        </Link>
      ))}
    </div>
  );
}
