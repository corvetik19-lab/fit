"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  LayoutPanelTop,
} from "lucide-react";

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

type HiddenBlocksState = {
  hero: boolean;
  menu: boolean;
  section: boolean;
};

type PageWorkspaceProps = {
  badges?: string[];
  description: string;
  initialSectionKey?: string;
  metrics: PageWorkspaceMetric[];
  sections: PageWorkspaceSection[];
  storageKey?: string;
  title: string;
};

const defaultHiddenBlocks: HiddenBlocksState = {
  hero: false,
  menu: false,
  section: false,
};

function getVisibilityStorageKey(storageKey?: string) {
  return storageKey ? `fit:${storageKey}:workspace-visibility` : null;
}

function SectionButton({
  active,
  description,
  label,
  sectionKey,
  onClick,
}: {
  active: boolean;
  description: string;
  label: string;
  sectionKey: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`section-chip w-full px-4 py-3 text-left md:min-w-[13rem] md:w-auto ${
        active ? "section-chip--active" : ""
      }`}
      data-testid={`page-workspace-option-${sectionKey}`}
      onClick={onClick}
      type="button"
    >
      <span className="block truncate text-sm font-semibold">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-muted">
        {description}
      </span>
    </button>
  );
}

function VisibilityButton({
  active,
  icon: Icon,
  label,
  onClick,
  testId,
}: {
  active: boolean;
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      aria-pressed={active}
      className={`toggle-chip px-4 py-2 text-sm font-medium ${
        active ? "toggle-chip--active" : ""
      }`}
      data-testid={testId}
      onClick={onClick}
      type="button"
    >
      <Icon size={16} strokeWidth={2.1} />
      {label}
    </button>
  );
}

export function PageWorkspace({
  badges = [],
  description,
  initialSectionKey,
  metrics,
  sections,
  storageKey,
  title,
}: PageWorkspaceProps) {
  const [activeSectionKey, setActiveSectionKey] = useState(
    initialSectionKey ?? sections[0]?.key ?? "",
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const visibilityStorageKey = useMemo(
    () => getVisibilityStorageKey(storageKey),
    [storageKey],
  );
  const [hiddenBlocks, setHiddenBlocks] =
    useState<HiddenBlocksState>(defaultHiddenBlocks);
  const [hasLoadedVisibility, setHasLoadedVisibility] = useState(false);

  useEffect(() => {
    if (!visibilityStorageKey) {
      setHasLoadedVisibility(true);
      return;
    }

    const savedState = window.localStorage.getItem(visibilityStorageKey);

    if (!savedState) {
      setHasLoadedVisibility(true);
      return;
    }

    try {
      const parsedState = JSON.parse(savedState) as
        | (Partial<HiddenBlocksState> & { sections?: boolean })
        | null;

      setHiddenBlocks({
        hero: parsedState?.hero === true,
        menu: parsedState?.menu === true || parsedState?.sections === true,
        section: parsedState?.section === true,
      });
    } catch {
      window.localStorage.removeItem(visibilityStorageKey);
    } finally {
      setHasLoadedVisibility(true);
    }
  }, [visibilityStorageKey]);

  useEffect(() => {
    if (!visibilityStorageKey || !hasLoadedVisibility) {
      return;
    }

    window.localStorage.setItem(
      visibilityStorageKey,
      JSON.stringify(hiddenBlocks),
    );
  }, [hasLoadedVisibility, hiddenBlocks, visibilityStorageKey]);

  const activeSection = useMemo(
    () =>
      sections.find((section) => section.key === activeSectionKey) ??
      sections[0] ??
      null,
    [activeSectionKey, sections],
  );

  function handleSectionSelect(nextKey: string) {
    setActiveSectionKey(nextKey);
    setIsMobileMenuOpen(false);
  }

  function toggleBlockVisibility(block: keyof HiddenBlocksState) {
    setHiddenBlocks((currentState) => ({
      ...currentState,
      [block]: !currentState[block],
    }));
  }

  return (
    <div className="grid gap-6">
      <section className="card card--hero p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Рабочая зона
            </p>
            <h2 className="app-display mt-2 text-lg font-semibold text-foreground sm:text-xl">
              Оставь на экране только нужные блоки
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <VisibilityButton
              active={!hiddenBlocks.hero}
              icon={hiddenBlocks.hero ? Eye : EyeOff}
              label={hiddenBlocks.hero ? "Показать обзор" : "Скрыть обзор"}
              onClick={() => toggleBlockVisibility("hero")}
              testId="page-workspace-visibility-hero"
            />
            <VisibilityButton
              active={!hiddenBlocks.menu}
              icon={hiddenBlocks.menu ? LayoutPanelTop : EyeOff}
              label={hiddenBlocks.menu ? "Показать меню" : "Скрыть меню"}
              onClick={() => toggleBlockVisibility("menu")}
              testId="page-workspace-visibility-menu"
            />
            <VisibilityButton
              active={!hiddenBlocks.section}
              icon={hiddenBlocks.section ? Eye : EyeOff}
              label={hiddenBlocks.section ? "Показать раздел" : "Скрыть раздел"}
              onClick={() => toggleBlockVisibility("section")}
              testId="page-workspace-visibility-section"
            />
          </div>
        </div>
      </section>

      {!hiddenBlocks.hero ? (
        <section className="card card--hero overflow-hidden p-5 sm:p-6 lg:p-8">
          <div className="grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
            <div className="space-y-4">
              {badges.length ? (
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                  {badges.map((badge) => (
                    <span className="pill" key={badge} title={badge}>
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="space-y-3">
                <h2 className="app-display max-w-4xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {title}
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
                  {description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {metrics.map((metric) => (
                <article className="metric-tile min-w-0 p-4" key={metric.label}>
                  <p className="truncate text-xs uppercase tracking-[0.18em] text-muted">
                    {metric.label}
                  </p>
                  <p className="mt-3 truncate text-3xl font-semibold text-foreground">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm text-muted">{metric.note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!hiddenBlocks.menu ? (
        <section className="card card--hero p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Разделы
              </p>
              <h2 className="app-display mt-2 text-xl font-semibold text-foreground">
                Держи в фокусе только нужный контекст
              </h2>
            </div>
            {activeSection ? (
              <span className="pill" title={activeSection.label}>
                {activeSection.label}
              </span>
            ) : null}
          </div>

          <div className="mt-4 md:hidden">
            <button
              aria-expanded={isMobileMenuOpen}
              className="section-chip flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              data-testid="page-workspace-mobile-trigger"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              type="button"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-xs uppercase tracking-[0.18em] text-muted">
                  Текущий раздел
                </span>
                <span className="mt-1 block truncate text-sm font-semibold text-foreground">
                  {activeSection?.label ?? "Выбери раздел"}
                </span>
                {activeSection ? (
                  <span className="mt-1 block text-xs leading-5 text-muted">
                    {activeSection.description}
                  </span>
                ) : null}
              </span>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white/88 text-foreground shadow-[0_18px_32px_-26px_rgba(20,58,160,0.22)]">
                {isMobileMenuOpen ? (
                  <ChevronUp size={18} strokeWidth={2.2} />
                ) : (
                  <ChevronDown size={18} strokeWidth={2.2} />
                )}
              </span>
            </button>

            {isMobileMenuOpen ? (
              <div className="mt-3 grid gap-2 rounded-3xl border border-border bg-[color-mix(in_srgb,var(--surface-overlay)_94%,white)] p-3 shadow-[0_30px_60px_-48px_rgba(20,58,160,0.22)]">
                {sections.map((section) => {
                  const isActive = activeSection?.key === section.key;

                  return (
                    <button
                      aria-pressed={isActive}
                      className={`section-chip flex w-full items-start justify-between gap-3 px-3 py-3 text-left ${
                        isActive ? "section-chip--active" : "border-transparent"
                      }`}
                      data-testid={`page-workspace-mobile-option-${section.key}`}
                      key={section.key}
                      onClick={() => handleSectionSelect(section.key)}
                      type="button"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">
                          {section.label}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted">
                          {section.description}
                        </span>
                      </span>
                      {isActive ? (
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/15 bg-[color-mix(in_srgb,var(--accent-soft)_76%,white)] text-accent">
                          <Check size={16} strokeWidth={2.3} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="mt-4 hidden gap-3 md:flex md:flex-wrap">
            {sections.map((section) => (
              <SectionButton
                active={activeSection?.key === section.key}
                description={section.description}
                key={section.key}
                label={section.label}
                sectionKey={section.key}
                onClick={() => handleSectionSelect(section.key)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!hiddenBlocks.section ? activeSection?.content : null}
    </div>
  );
}
