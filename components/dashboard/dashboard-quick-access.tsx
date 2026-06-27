"use client";

import {
  Banknote,
  CreditCard,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

const shortcuts = [
  { label: "Nouveau patient", href: "/patients", icon: UserPlus },
  { label: "Nouvelle tâche", href: "/tasks", icon: Stethoscope },
  { label: "Relance rapide", href: "/reglements", icon: CreditCard },
  { label: "Règlement reçu", href: "/reglements", icon: Banknote },
] as const;

export function DashboardActionChips({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {shortcuts.map(({ label, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-sky-200 hover:bg-sky-50/80 hover:text-sky-900"
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={1.75} aria-hidden />
          <span className="whitespace-nowrap">{label}</span>
        </Link>
      ))}
    </div>
  );
}
