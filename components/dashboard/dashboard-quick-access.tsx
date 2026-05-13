"use client";

import {
  CreditCard,
  MessageSquare,
  Send,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

const shortcuts = [
  { label: "Nouveau patient", href: "/patients", icon: UserPlus, accent: "from-emerald-400/90 to-teal-500" },
  { label: "Nouvelle tâche", href: "/tasks", icon: Stethoscope, accent: "from-sky-400/90 to-blue-600" },
  { label: "Relance rapide", href: "/reglements", icon: CreditCard, accent: "from-amber-400/90 to-orange-500" },
  { label: "Envoyer email", href: "/emails", icon: Send, accent: "from-violet-400/90 to-indigo-600" },
  { label: "Messages", href: "/messages", icon: MessageSquare, accent: "from-slate-500/90 to-slate-700" },
  { label: "Liste patients", href: "/patients", icon: Users, accent: "from-cyan-400/90 to-sky-600" },
];

export function DashboardQuickAccess({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="grid h-full grid-cols-3 gap-1">
        {shortcuts.map(({ label, href, icon: Icon, accent }) => (
          <Link
            key={label}
            href={href}
            title={label}
            className="group flex flex-col items-center justify-center gap-0.5 rounded-lg border border-slate-100 bg-slate-50/80 px-0.5 py-1 text-center transition hover:border-slate-200 hover:bg-white"
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${accent} text-white shadow-sm`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
            </span>
            <span className="line-clamp-2 text-[8px] font-medium leading-tight text-slate-700">{label}</span>
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
