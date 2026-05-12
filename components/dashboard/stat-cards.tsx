import { StatCardData } from "@/types/domain";

const colorByPriority = {
  urgente: "border-red-100 bg-red-50 text-red-700",
  importante: "border-orange-100 bg-orange-50 text-orange-700",
  normale: "border-amber-100 bg-amber-50 text-amber-700",
  faible: "border-emerald-100 bg-emerald-50 text-emerald-700",
};

interface StatCardsProps {
  stats: StatCardData[];
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-slate-600">{stat.label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
          <p
            className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${colorByPriority[stat.priority]}`}
          >
            {stat.trend}
          </p>
        </article>
      ))}
    </section>
  );
}
