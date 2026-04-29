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

import { RepairMojibakeTree } from "@/components/repair-mojibake-tree";

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
  return storageKey ? `fitora:${storageKey}:workspace-visibility` : null;
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
      className={`section-chip w-full px-3 py-2.5 text-left md:min-w-[9.5rem] md:w-auto ${
        active ? "section-chip--active" : ""
      }`}
      data-testid={`page-workspace-option-${sectionKey}`}
      onClick={onClick}
      type="button"
    >
      <span className="block text-sm font-semibold text-foreground">{label}</span>
      <span className="mt-0.5 block text-xs leading-5 text-muted">
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
      className={`toggle-chip px-3 py-2 text-sm font-medium ${
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
    <RepairMojibakeTree>
      <div className="grid gap-2.5 sm:gap-3.5">
        <section className="surface-panel surface-panel--soft hidden p-3 xl:block">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="workspace-kicker">Экран</p>
              <p className="text-sm font-semibold text-foreground">
                Оставь на экране только нужные блоки
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <VisibilityButton
                active={!hiddenBlocks.hero}
                icon={hiddenBlocks.hero ? Eye : EyeOff}
                label={
                  hiddenBlocks.hero ? "Показать обзор" : "Скрыть обзор"
                }
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
                label={
                  hiddenBlocks.section ? "Показать раздел" : "Скрыть раздел"
                }
                onClick={() => toggleBlockVisibility("section")}
                testId="page-workspace-visibility-section"
              />
            </div>
          </div>
        </section>

        {!hiddenBlocks.hero ? (
          <section className="surface-panel surface-panel--soft overflow-hidden p-2.5 sm:p-3.5">
            <div className="grid gap-2.5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div className="space-y-2">
                {badges.length ? (
                  <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                    {badges.map((badge) => (
                      <span className="pill" key={badge} title={badge}>
                        {badge}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <p className="workspace-kicker">Фокус</p>
                  <h2 className="app-display max-w-4xl text-[1.06rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[1.45rem]">
                    {title}
                  </h2>
                  <p className="max-w-3xl text-[0.78rem] leading-5 text-muted sm:text-sm sm:leading-6">
                    {description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
                {metrics.map((metric) => (
                  <article
                    className="metric-tile p-2 sm:p-3"
                    key={metric.label}
                  >
                    <p className="truncate text-[9px] uppercase tracking-[0.15em] text-muted sm:text-[10px]">
                      {metric.label}
                    </p>
                    <p className="mt-0.5 truncate text-[0.95rem] font-semibold text-foreground sm:mt-1 sm:text-lg">
                      {metric.value}
                    </p>
                    <p className="mt-1 hidden text-[0.72rem] leading-5 text-muted sm:block">
                      {metric.note}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {!hiddenBlocks.menu ? (
          <section className="surface-panel surface-panel--soft p-2.5 sm:p-3">
            <div className="hidden flex-col gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="workspace-kicker">Разделы</p>
                <p className="text-sm font-semibold text-foreground">
                  Открой только нужный слой
                </p>
              </div>

              {activeSection ? (
                <span className="pill" title={activeSection.label}>
                  {activeSection.label}
                </span>
              ) : null}
            </div>

            <div className="md:hidden">
              <button
                aria-expanded={isMobileMenuOpen}
                className="section-chip flex w-full items-center justify-between gap-2.5 px-3 py-2.5 text-left"
                data-testid="page-workspace-mobile-trigger"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
                type="button"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-muted">
                    Текущий раздел
                  </span>
                  <span className="mt-1 block truncate text-sm font-semibold text-foreground">
                    {activeSection?.label ?? "Выбери раздел"}
                  </span>
                  {activeSection ? (
                    <span className="mt-0.5 hidden text-xs leading-5 text-muted sm:block">
                      {activeSection.description}
                    </span>
                  ) : null}
                </span>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-white text-accent-strong">
                  {isMobileMenuOpen ? (
                    <ChevronUp size={18} strokeWidth={2.2} />
                  ) : (
                    <ChevronDown size={18} strokeWidth={2.2} />
                  )}
                </span>
              </button>

              {isMobileMenuOpen ? (
                <div className="mt-2 grid gap-1.5">
                  {sections.map((section) => {
                    const isActive = activeSection?.key === section.key;

                    return (
                      <button
                        aria-pressed={isActive}
                        className={`section-chip flex w-full items-start justify-between gap-2.5 px-3 py-2.5 text-left ${
                          isActive ? "section-chip--active" : ""
                        }`}
                        data-testid={`page-workspace-mobile-option-${section.key}`}
                        key={section.key}
                        onClick={() => handleSectionSelect(section.key)}
                        type="button"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">
                            {section.label}
                          </span>
                          <span className="mt-0.5 hidden text-xs leading-5 text-muted sm:block">
                            {section.description}
                          </span>
                        </span>
                        {isActive ? (
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-soft)_32%,white)] text-accent-strong">
                            <Check size={15} strokeWidth={2.2} />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="mt-0 hidden gap-2 overflow-x-auto pb-1 md:flex md:flex-nowrap">
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
    </RepairMojibakeTree>
  );
}
