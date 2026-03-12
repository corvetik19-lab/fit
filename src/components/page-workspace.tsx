"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type PageWorkspaceMetric = {
  label: string;
  note: string;
  value: string;
};

type PageWorkspaceSection = {
  content: ReactNode;
  description: string;
  key: string;
  label: string;
};

type PageWorkspaceProps = {
  badges?: string[];
  description: string;
  initialSectionKey?: string;
  metrics: PageWorkspaceMetric[];
  sections: PageWorkspaceSection[];
  title: string;
};

function SectionButton({
  active,
  description,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`min-w-[13rem] rounded-3xl border px-4 py-3 text-left transition ${
        active
          ? "border-accent/30 bg-accent-soft text-foreground shadow-[0_18px_45px_-35px_rgba(20,97,75,0.45)]"
          : "border-border bg-white/72 text-foreground hover:bg-white"
      } w-full md:min-w-[13rem] md:w-auto`}
      onClick={onClick}
      type="button"
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-muted">{description}</span>
    </button>
  );
}

export function PageWorkspace({
  badges = [],
  description,
  initialSectionKey,
  metrics,
  sections,
  title,
}: PageWorkspaceProps) {
  const [activeSectionKey, setActiveSectionKey] = useState(
    initialSectionKey ?? sections[0]?.key ?? "",
  );

  const activeSection = useMemo(
    () =>
      sections.find((section) => section.key === activeSectionKey) ?? sections[0] ?? null,
    [activeSectionKey, sections],
  );

  return (
    <div className="grid gap-6">
      <section className="card overflow-hidden p-5 sm:p-6 lg:p-8">
        <div className="grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
          <div className="space-y-4">
            {badges.length ? (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span className="pill" key={badge}>
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="space-y-3">
              <h2 className="max-w-4xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {title}
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                {description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric) => (
              <article
                className="rounded-3xl border border-border bg-white/80 p-4 shadow-[0_18px_48px_-40px_rgba(15,23,42,0.28)]"
                key={metric.label}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm text-muted">{metric.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Логические разделы
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Открывай только нужный блок, а не всю страницу целиком
            </h2>
          </div>
          {activeSection ? <span className="pill">{activeSection.label}</span> : null}
        </div>

        <div className="mt-4 grid gap-3 md:flex md:flex-wrap md:gap-3">
          {sections.map((section) => (
            <SectionButton
              active={activeSection?.key === section.key}
              description={section.description}
              key={section.key}
              label={section.label}
              onClick={() => setActiveSectionKey(section.key)}
            />
          ))}
        </div>
      </section>

      {activeSection?.content}
    </div>
  );
}
