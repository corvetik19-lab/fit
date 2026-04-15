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
    <section className="surface-panel p-4 sm:p-5">
      <div className="mb-4">
        <p className="workspace-kicker">{caption}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
