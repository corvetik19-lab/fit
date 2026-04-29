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

const BUILT_IN_PROMPTS: BuiltInPromptTemplate[] = [
  {
    id: "progress-review",
    title: "Разбор прогресса",
    subtitle: "Понять, что улучшить уже на этой неделе.",
    prompt:
      "Разбери мой текущий прогресс и подскажи, что улучшить на этой неделе.",
  },
  {
    id: "light-workout",
    title: "Тренировка без перегруза",
    subtitle: "Собрать безопасную сессию по моей истории.",
    prompt:
      "Собери тренировку без перегруза с учётом моей истории и текущего восстановления.",
  },
  {
    id: "meal-plan",
    title: "План питания на день",
    subtitle: "Упор на белок, восстановление и удобство.",
    prompt:
      "Составь план питания на день с упором на белок и восстановление.",
  },
  {
    id: "meal-photo",
    title: "Разбор фото еды",
    subtitle: "Оценить состав, рецепт и возможные замены.",
    prompt:
      "Разбери фото еды, оцени состав и предложи рецепт или улучшения.",
  },
];

function loadCustomPromptTemplates(): CustomPromptTemplate[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
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
    return [];
  }
}

function saveCustomPromptTemplates(items: CustomPromptTemplate[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function matchesSearch(value: string, query: string) {
  return value.toLocaleLowerCase("ru-RU").includes(query);
}

function formatPromptDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

  const resetCreateForm = useCallback(() => {
    setIsCreating(false);
    setNewTitle("");
    setNewPrompt("");
  }, []);

  const handleClose = useCallback(() => {
    setSearch("");
    resetCreateForm();
    onClose();
  }, [onClose, resetCreateForm]);

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
      return (
        matchesSearch(item.title, normalizedSearch) ||
        matchesSearch(item.prompt, normalizedSearch)
      );
    });
  }, [customPrompts, normalizedSearch]);

  function handleCreatePrompt() {
    const title = newTitle.trim();
    const prompt = newPrompt.trim();

    if (!title || !prompt) {
      return;
    }

    setCustomPrompts((current) => {
      const nextItems = [
        {
          id: crypto.randomUUID(),
          title,
          prompt,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ];

      saveCustomPromptTemplates(nextItems);
      return nextItems;
    });

    resetCreateForm();
  }

  function handleDeletePrompt(id: string) {
    setCustomPrompts((current) => {
      const nextItems = current.filter((item) => item.id !== id);
      saveCustomPromptTemplates(nextItems);
      return nextItems;
    });
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
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[rgba(15,23,42,0.36)] px-3 py-3 backdrop-blur-[10px] sm:items-center sm:px-6 sm:py-6"
      data-testid="ai-prompt-library"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="flex max-h-[min(88dvh,52rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.6rem] border border-border bg-white shadow-[0_30px_90px_-34px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Шаблоны запросов
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Готовые и свои запросы. Шаблон вставляется в поле ввода и не засоряет переписку.
            </p>
          </div>

          <button
            aria-label="Закрыть библиотеку шаблонов"
            className="chat-toolbar-button shrink-0"
            onClick={handleClose}
            type="button"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <label className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              size={16}
            />
            <input
              className="h-11 w-full rounded-full border border-border bg-white pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по шаблонам"
              ref={searchInputRef}
              value={search}
            />
          </label>

          <button
            className="action-button action-button--secondary h-11 justify-center px-4 text-sm"
            data-testid="ai-prompt-library-toggle-create"
            onClick={() => setIsCreating((current) => !current)}
            type="button"
          >
            <Plus size={16} strokeWidth={2.2} />
            {isCreating ? "Скрыть форму" : "Новый шаблон"}
          </button>
        </div>

        {isCreating ? (
          <div className="grid gap-3 border-b border-border bg-[color:var(--surface-soft)] px-5 py-4 sm:px-6">
            <input
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
              data-testid="ai-prompt-library-new-title"
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Название шаблона"
              value={newTitle}
            />
            <textarea
              className="min-h-24 w-full resize-none rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
              data-testid="ai-prompt-library-new-prompt"
              onChange={(event) => setNewPrompt(event.target.value)}
              placeholder="Например: составь план питания на 3 дня с учётом последних тренировок."
              value={newPrompt}
            />
            <div className="flex flex-wrap gap-2">
              <button
                className="action-button action-button--primary"
                data-testid="ai-prompt-library-save"
                disabled={!newTitle.trim() || !newPrompt.trim()}
                onClick={handleCreatePrompt}
                type="button"
              >
                Сохранить шаблон
              </button>
              <button
                className="action-button action-button--secondary"
                onClick={resetCreateForm}
                type="button"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-5 sm:px-6">
          <PromptGroup
            emptyText="По текущему поиску готовые шаблоны не найдены."
            items={filteredBuiltInPrompts}
            label="Готовые шаблоны"
            onSelect={handleSelectPrompt}
          />

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Мои шаблоны</p>
              <span className="pill">{filteredCustomPrompts.length}</span>
            </div>

            {filteredCustomPrompts.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {filteredCustomPrompts.map((item) => (
                  <div
                    className="surface-panel surface-panel--soft p-3.5"
                    data-testid="ai-custom-prompt-card"
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted">
                          Сохранён {formatPromptDate(item.createdAt)}
                        </p>
                      </div>
                      <span className="pill">Моё</span>
                    </div>

                    <p className="mt-3 rounded-2xl bg-white px-3 py-3 text-sm leading-6 text-foreground">
                      {item.prompt}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="action-button action-button--primary px-4 py-2 text-sm"
                        data-testid="ai-custom-prompt-insert"
                        onClick={() => handleSelectPrompt(item.prompt)}
                        type="button"
                      >
                        <WandSparkles size={15} strokeWidth={2.1} />
                        Вставить
                      </button>
                      <button
                        className="action-button action-button--secondary px-4 py-2 text-sm"
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
              <div className="surface-panel border-dashed px-4 py-5 text-sm leading-6 text-muted">
                Здесь будут твои шаблоны для чата, питания и тренировок.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PromptGroup({
  emptyText,
  items,
  label,
  onSelect,
}: {
  emptyText: string;
  items: BuiltInPromptTemplate[];
  label: string;
  onSelect: (prompt: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <span className="pill">{items.length}</span>
      </div>

      {items.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <div className="surface-panel surface-panel--soft p-3.5" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.subtitle}</p>
                </div>
                <span className="pill">Готово</span>
              </div>

              <p className="mt-3 rounded-2xl bg-white px-3 py-3 text-sm leading-6 text-foreground">
                {item.prompt}
              </p>

              <div className="mt-3">
                <button
                  className="action-button action-button--primary px-4 py-2 text-sm"
                  onClick={() => onSelect(item.prompt)}
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
        <div className="surface-panel border-dashed px-4 py-5 text-sm leading-6 text-muted">
          {emptyText}
        </div>
      )}
    </div>
  );
}
