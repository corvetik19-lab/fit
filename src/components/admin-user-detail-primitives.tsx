"use client";

import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
      <p className="text-muted">{label}</p>
      <p className="mt-2 font-semibold text-foreground">{value}</p>
    </article>
  );
}

export function KeyValueCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <article className="rounded-2xl border border-border bg-white/60 p-4 text-sm">
      <p className="font-semibold text-foreground">{title}</p>
      <div className="mt-3 grid gap-2">
        {rows.map((row) => (
          <p className="text-muted" key={row.label}>
            {row.label}: <span className="text-foreground">{row.value}</span>
          </p>
        ))}
      </div>
    </article>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-7 text-muted">{children}</p>;
}
