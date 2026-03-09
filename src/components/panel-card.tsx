import type { ReactNode } from "react";

export function PanelCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <section className="card p-6">
      <div className="mb-4">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
          {caption}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}
