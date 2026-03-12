"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Trash2, WandSparkles, X } from "lucide-react";

type BuiltInPromptTemplate = {
  id: string;
  prompt: string;
  subtitle: string;
  title: string;
};

type CustomPromptTemplate = {
  createdAt: string;
  id: string;
  prompt: string;
  title: string;
};

type AiPromptLibraryProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
};

const STORAGE_KEY = "fit.ai.prompt-library";
const STORAGE_EVENT = "fit-ai-prompt-library-updated";

const BUILT_IN_PROMPTS: BuiltInPromptTemplate[] = [
  {
    id: "progress-review",
    title: "Разбор прогресса",
    subtitle: "Понять, что улучшить уже на этой неделе.",
    prompt: "Разбери мой текущий прогресс и подскажи, что улучшить на этой неделе.",
  },
  {
    id: "light-workout",
    title: "Тренировка без перегруза",
    subtitle: "Собрать безопасную сессию по моей истории.",
    prompt: "Собери тренировку без перегруза с учётом моей истории.",
  },
  {
    id: "meal-plan",
    title: "План питания на день",
    subtitle: "С упором на белок, восстановление и удобство.",
    prompt: "Составь план питания на день с упором на белок и восстановление.",
  },
  {
    id: "meal-photo",
    title: "Разбор фото еды",
    subtitle: "Оценить состав, рецепт и возможные замены.",
    prompt: "Разбери фото еды, оцени состав и предложи рецепт или улучшения.",
  },
];

function loadCustomPromptTemplates() {
  if (typeof window === "undefined") {
    return [] as CustomPromptTemplate[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [] as CustomPromptTemplate[];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [] as CustomPromptTemplate[];
    }

    return parsed.filter((item): item is CustomPromptTemplate => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as Partial<CustomPromptTemplate>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.title === "string" &&
        typeof candidate.prompt === "string" &&
        typeof candidate.createdAt === "string"
      );
    });
  } catch {
    return [] as CustomPromptTemplate[];
  }
}

function saveCustomPromptTemplates(items: CustomPromptTemplate[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function matchesSearch(value: string, query: string) {
  return value.toLocaleLowerCase("ru-RU").includes(query);
}

export function AiPromptLibrary({
  isOpen,
  onClose,
  onSelect,
}: AiPromptLibraryProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [search, setSearch] = useState("");
  const [customPrompts, setCustomPrompts] = useState<CustomPromptTemplate[]>(() =>
    loadCustomPromptTemplates(),
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrompt, setNewPrompt] = useState("");

  function resetCreateForm() {
    setIsCreating(false);
    setNewTitle("");
    setNewPrompt("");
  }

  const handleClose = useCallback(() => {
    setSearch("");
    resetCreateForm();
    onClose();
  }, [onClose]);

  useEffect(() => {
    const syncPrompts = () => {
      setCustomPrompts(loadCustomPromptTemplates());
    };

    window.addEventListener(STORAGE_EVENT, syncPrompts);
    window.addEventListener("storage", syncPrompts);

    return () => {
      window.removeEventListener(STORAGE_EVENT, syncPrompts);
      window.removeEventListener("storage", syncPrompts);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 40);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [handleClose, isOpen]);

  useEffect(() => {
    saveCustomPromptTemplates(customPrompts);
  }, [customPrompts]);

  const normalizedSearch = search.trim().toLocaleLowerCase("ru-RU");

  const filteredBuiltInPrompts = useMemo(() => {
    if (!normalizedSearch) {
      return BUILT_IN_PROMPTS;
    }

    return BUILT_IN_PROMPTS.filter((item) => {
      return (
        matchesSearch(item.title, normalizedSearch) ||
        matchesSearch(item.subtitle, normalizedSearch) ||
        matchesSearch(item.prompt, normalizedSearch)
      );
    });
  }, [normalizedSearch]);

  const filteredCustomPrompts = useMemo(() => {
    if (!normalizedSearch) {
      return customPrompts;
    }

    return customPrompts.filter((item) => {
      return matchesSearch(item.title, normalizedSearch) || matchesSearch(item.prompt, normalizedSearch);
    });
  }, [customPrompts, normalizedSearch]);

  function handleCreatePrompt() {
    const title = newTitle.trim();
    const prompt = newPrompt.trim();

    if (!title || !prompt) {
      return;
    }

    setCustomPrompts((current) => [
      {
        id: crypto.randomUUID(),
        title,
        prompt,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);

    resetCreateForm();
  }

  function handleDeletePrompt(id: string) {
    setCustomPrompts((current) => current.filter((item) => item.id !== id));
  }

  function handleSelectPrompt(prompt: string) {
    onSelect(prompt);
    handleClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[rgba(24,22,19,0.42)] px-3 py-3 backdrop-blur-[10px] sm:items-center sm:px-6 sm:py-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="flex max-h-[min(88dvh,52rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-border bg-[color-mix(in_srgb,var(--surface)_96%,white)] shadow-[0_30px_90px_-34px_rgba(24,22,19,0.44)]">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Шаблоны запросов</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Готовые варианты и твои собственные запросы. Шаблон вставляется в поле ввода и не
              мешает переписке.
            </p>
          </div>

          <button
            aria-label="Закрыть библиотеку шаблонов"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/80 text-foreground transition hover:bg-white"
            onClick={handleClose}
            type="button"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              className="h-12 w-full rounded-full border border-border bg-white/85 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по готовым и сохранённым шаблонам"
              ref={searchInputRef}
              value={search}
            />
          </label>

          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-white/85 px-4 text-sm font-medium text-foreground transition hover:bg-white"
            onClick={() => setIsCreating((current) => !current)}
            type="button"
          >
            <Plus size={16} strokeWidth={2.2} />
            {isCreating ? "Скрыть форму" : "Новый шаблон"}
          </button>
        </div>

        {isCreating ? (
          <div className="grid gap-3 border-b border-border bg-white/55 px-5 py-4 sm:px-6">
            <input
              className="h-12 w-full rounded-2xl border border-border bg-white/90 px-4 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Название шаблона"
              value={newTitle}
            />
            <textarea
              className="min-h-28 w-full resize-none rounded-3xl border border-border bg-white/90 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
              onChange={(event) => setNewPrompt(event.target.value)}
              placeholder="Например: составь план питания на 3 дня с учётом моих последних тренировок и текущей цели."
              value={newPrompt}
            />
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!newTitle.trim() || !newPrompt.trim()}
                onClick={handleCreatePrompt}
                type="button"
              >
                Сохранить шаблон
              </button>
              <button
                className="rounded-full border border-border bg-white/85 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
                onClick={resetCreateForm}
                type="button"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Готовые шаблоны</p>
              <span className="pill">{filteredBuiltInPrompts.length}</span>
            </div>

            {filteredBuiltInPrompts.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {filteredBuiltInPrompts.map((item) => (
                  <div
                    className="rounded-3xl border border-border bg-white/85 p-4"
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted">{item.subtitle}</p>
                      </div>
                      <span className="pill">Готово</span>
                    </div>

                    <p className="mt-4 rounded-2xl bg-[rgba(20,97,75,0.06)] px-3 py-3 text-sm leading-6 text-foreground">
                      {item.prompt}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        onClick={() => handleSelectPrompt(item.prompt)}
                        type="button"
                      >
                        <WandSparkles size={15} strokeWidth={2.1} />
                        Вставить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-white/70 px-4 py-5 text-sm leading-6 text-muted">
                По текущему запросу готовые шаблоны не найдены.
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Мои шаблоны</p>
              <span className="pill">{filteredCustomPrompts.length}</span>
            </div>

            {filteredCustomPrompts.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {filteredCustomPrompts.map((item) => (
                  <div
                    className="rounded-3xl border border-border bg-white/85 p-4"
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted">
                          Сохранён {new Intl.DateTimeFormat("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(item.createdAt))}
                        </p>
                      </div>
                      <span className="pill">Моё</span>
                    </div>

                    <p className="mt-4 rounded-2xl bg-[rgba(20,97,75,0.06)] px-3 py-3 text-sm leading-6 text-foreground">
                      {item.prompt}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        onClick={() => handleSelectPrompt(item.prompt)}
                        type="button"
                      >
                        <WandSparkles size={15} strokeWidth={2.1} />
                        Вставить
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-white/90 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
                        onClick={() => handleDeletePrompt(item.id)}
                        type="button"
                      >
                        <Trash2 size={15} strokeWidth={2.1} />
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-white/70 px-4 py-5 text-sm leading-6 text-muted">
                Здесь будут твои шаблоны. Можно сохранить часто используемые запросы для чата,
                разбора прогресса, питания и тренировок.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
