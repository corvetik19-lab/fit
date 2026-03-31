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
    <section className="card card--hero p-6 sm:p-7">
      <div className="mb-5">
        <p className="workspace-kicker">{caption}</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
