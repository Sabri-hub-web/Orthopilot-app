import Link from "next/link";
import { ArrowRight, CreditCard, Stethoscope, Users } from "lucide-react";

const quickLinks = [
  {
    title: "Suivi des Règlements",
    description: "Relances, retards et encaissements du cabinet.",
    href: "/reglements",
    icon: CreditCard,
    accent: "from-violet-500 to-indigo-600",
    ring: "hover:border-violet-200 hover:shadow-violet-100/80",
  },
  {
    title: "Fiches Patients",
    description: "Dossiers, documents et suivi administratif.",
    href: "/patients",
    icon: Users,
    accent: "from-slate-600 to-slate-800",
    ring: "hover:border-slate-300 hover:shadow-slate-100/80",
  },
  {
    title: "Tâches Internes",
    description: "Priorités de l’équipe et actions du jour.",
    href: "/tasks",
    icon: Stethoscope,
    accent: "from-indigo-500 to-violet-600",
    ring: "hover:border-indigo-200 hover:shadow-indigo-100/80",
  },
] as const;

export function HomeView({ greetingName }: { greetingName: string }) {
  const displayName = greetingName.trim() || "l’équipe";

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col justify-center gap-6 overflow-hidden px-1 py-2 sm:gap-8 sm:px-2">
      <header className="text-center sm:text-left">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">
          OrthoPilot
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Bienvenue sur OrthoPilot, {displayName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
          Espace de gestion interne du cabinet — accédez rapidement aux modules essentiels
          du secrétariat.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {quickLinks.map(({ title, description, href, icon: Icon, accent, ring }) => (
          <Link
            key={href}
            href={href}
            className={`group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none ${ring}`}
          >
            <span
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden />
            </span>
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-slate-500">{description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-violet-600 transition group-hover:gap-1.5">
              Ouvrir
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </span>
          </Link>
        ))}
      </section>

      <aside className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-slate-50 px-5 py-4 shadow-sm">
        <p className="text-[13px] font-semibold text-slate-900">Rappel secrétariat</p>
        <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-slate-600">
          OrthoPilot centralise le suivi des règlements, les fiches patients et les tâches
          internes pour fluidifier le travail quotidien du cabinet — sans distraction, en un
          clin d’œil.
        </p>
      </aside>
    </div>
  );
}
