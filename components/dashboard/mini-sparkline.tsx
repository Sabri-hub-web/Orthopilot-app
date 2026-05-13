"use client";

import { hashSeed } from "@/lib/dashboard-ui";

/** Courbe décorative stable (pas de données temps réel). */
export function MiniSparkline({
  seedKey,
  className,
  variant = "default",
}: {
  seedKey: string;
  className?: string;
  variant?: "default" | "kpi";
}) {
  const points = variant === "kpi" ? 12 : 10;
  const viewH = variant === "kpi" ? 28 : 36;
  let v = hashSeed(seedKey) || 1;
  const ys: number[] = [];
  for (let i = 0; i < points; i += 1) {
    v = (v * 1103515245 + 12345) % 2147483647;
    ys.push(6 + (v % (variant === "kpi" ? 14 : 18)));
  }
  const d = ys
    .map((y, i) => {
      const x = (i / (points - 1)) * 100;
      const py = viewH - y;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className={className}
      viewBox={`0 0 100 ${viewH}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={variant === "kpi" ? 1.1 : 1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.55"
      />
    </svg>
  );
}
