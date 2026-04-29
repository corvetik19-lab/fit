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
    <article className="surface-panel surface-panel--soft p-3.5 text-sm">
      <p className="text-muted">{label}</p>
      <p className="mt-1.5 font-semibold text-foreground">{value}</p>
    </article>
  );
}

export function KeyValueCard({
  title,
  rows,
  testId,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
  testId?: string;
}) {
  return (
    <article
      className="surface-panel surface-panel--soft p-3.5 text-sm"
      data-testid={testId}
    >
      <p className="font-semibold text-foreground">{title}</p>
      <div className="mt-2.5 grid gap-2">
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
