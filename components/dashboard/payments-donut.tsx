"use client";

import type { PaymentDistributionSlice } from "@/lib/dashboard-ui";

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
}

export function PaymentsDonut({
  slices,
  total,
  compact = false,
}: {
  slices: PaymentDistributionSlice[];
  total: number;
  compact?: boolean;
}) {
  const cx = 80;
  const cy = 80;
  const rOuter = compact ? 54 : 52;
  const rInner = compact ? 32 : 34;

  function polar(ang: number, rad: number) {
    return [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)] as const;
  }

  let angle = -Math.PI / 2;
  const paths: { d: string; fill: string }[] = [];

  if (total > 0 && slices.length > 0) {
    for (const slice of slices) {
      const sweep = (slice.amount / total) * 2 * Math.PI;
      if (sweep < 0.001) continue;
      const a0 = angle;
      const a1 = angle + sweep;
      const large = sweep > Math.PI ? 1 : 0;
      const [x1, y1] = polar(a0, rOuter);
      const [x2, y2] = polar(a1, rOuter);
      const [x3, y3] = polar(a1, rInner);
      const [x4, y4] = polar(a0, rInner);
      const d = [
        `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
        `A ${rOuter} ${rOuter} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
        `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
        `A ${rInner} ${rInner} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
        "Z",
      ].join(" ");
      paths.push({ d, fill: slice.color });
      angle = a1;
    }
  }

  if (compact) {
    return (
      <div className="flex h-full w-full max-w-full items-stretch justify-center gap-2.5 px-0.5 sm:gap-3">
        <div className="relative h-[6.25rem] w-[6.25rem] shrink-0 self-center">
          <svg viewBox="0 0 160 160" className="absolute inset-0 h-full w-full drop-shadow-sm" aria-hidden>
            {paths.length ? (
              paths.map((p, i) => <path key={i} d={p.d} fill={p.fill} stroke="white" strokeWidth="0.65" />)
            ) : (
              <circle cx={cx} cy={cy} r={(rOuter + rInner) / 2} fill="#e2e8f0" />
            )}
          </svg>
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-1 text-center">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-500">Total</p>
            <p className="text-xs font-bold leading-tight tabular-nums text-slate-900">{formatEur(total)}</p>
            <p className="text-[8px] text-slate-500">EUR</p>
          </div>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col justify-center gap-1 text-[10px] leading-tight">
          {slices.length ? (
            slices.map((s) => (
              <li key={s.status} className="flex items-center justify-between gap-2 border-b border-slate-100/80 py-0.5 last:border-0">
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-slate-600">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="truncate font-medium">{s.status}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-900">{formatEur(s.amount)}</span>
              </li>
            ))
          ) : (
            <li className="text-slate-500">Aucune donnée.</li>
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 160 160" className="absolute inset-0 h-full w-full drop-shadow-sm" aria-hidden>
          {paths.length ? (
            paths.map((p, i) => <path key={i} d={p.d} fill={p.fill} stroke="white" strokeWidth="0.5" />)
          ) : (
            <circle cx={cx} cy={cy} r={(rOuter + rInner) / 2} fill="#e2e8f0" />
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Total</p>
          <p className="text-lg font-bold tabular-nums text-slate-900">{formatEur(total)}</p>
          <p className="text-[10px] text-slate-500">EUR</p>
        </div>
      </div>
      <ul className="flex w-full max-w-[200px] flex-col gap-2 text-xs">
        {slices.length ? (
          slices.map((s) => (
            <li key={s.status} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                {s.status}
              </span>
              <span className="font-medium tabular-nums text-slate-900">{formatEur(s.amount)}</span>
            </li>
          ))
        ) : (
          <li className="text-slate-500">Aucune donnée de répartition.</li>
        )}
      </ul>
    </div>
  );
}
