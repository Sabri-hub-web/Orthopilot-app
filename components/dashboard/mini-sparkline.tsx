"use client";

import { hashSeed } from "@/lib/dashboard-ui";

/** Courbe décorative stable (pas de données temps réel). */
export function MiniSparkline({ seedKey, className }: { seedKey: string; className?: string }) {
  const points = 10;
  let v = hashSeed(seedKey) || 1;
  const ys: number[] = [];
  for (let i = 0; i < points; i += 1) {
    v = (v * 1103515245 + 12345) % 2147483647;
    ys.push(8 + (v % 18));
  }
  const d = ys
    .map((y, i) => {
      const x = (i / (points - 1)) * 100;
      const py = 36 - y;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className={className}
      viewBox="0 0 100 36"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.55"
      />
    </svg>
  );
}
