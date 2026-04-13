"use client";

import { Globe, ImagePlus, WandSparkles } from "lucide-react";

type AiChatToolbarProps = {
  allowWebSearch: boolean;
  mealPhotoAccessAllowed: boolean;
  onOpenMealPhoto: () => void;
  onOpenPromptLibrary: () => void;
  onReset: () => void;
  onToggleWebSearch: () => void;
  selectedImage: boolean;
  sessionTitle: string | null;
};

export function AiChatToolbar({
  allowWebSearch,
  mealPhotoAccessAllowed,
  onOpenMealPhoto,
  onOpenPromptLibrary,
  onReset,
  onToggleWebSearch,
  selectedImage,
  sessionTitle,
}: AiChatToolbarProps) {
  return (
    <div
      className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 pb-4"
      data-testid="ai-chat-toolbar"
    >
      <div className="min-w-0 flex-1">
        <p className="workspace-kicker">Сессия AI-коуча</p>
        <p className="mt-2 truncate text-base font-semibold text-foreground">
          {sessionTitle?.trim() || "Новый чат"}
        </p>
        <p className="mt-1 text-sm leading-6 text-muted">
          Быстрый режим для вопросов, разбора прогресса, фото еды и сборки
          плана без лишних переходов по экрану.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          aria-label={
            allowWebSearch
              ? "Выключить поиск в интернете"
              : "Включить поиск в интернете"
          }
          aria-pressed={allowWebSearch}
          className={`chat-toolbar-button ${
            allowWebSearch ? "chat-toolbar-button--active" : ""
          }`}
          data-testid="ai-web-search-toggle"
          onClick={onToggleWebSearch}
          type="button"
        >
          <Globe size={18} strokeWidth={2.2} />
        </button>

        <button
          aria-label="Открыть шаблоны"
          className="chat-toolbar-button"
          data-testid="ai-prompt-library-open"
          onClick={onOpenPromptLibrary}
          type="button"
        >
          <WandSparkles size={16} strokeWidth={2.1} />
        </button>

        <button
          aria-label="Выбрать фото еды"
          className={`chat-toolbar-button ${
            selectedImage ? "chat-toolbar-button--active" : ""
          }`}
          data-testid="ai-meal-photo-open"
          disabled={!mealPhotoAccessAllowed}
          onClick={onOpenMealPhoto}
          type="button"
        >
          <ImagePlus size={18} strokeWidth={2.2} />
        </button>

        <button
          className="toggle-chip px-4 py-2 text-sm font-semibold"
          data-testid="ai-chat-reset"
          onClick={onReset}
          type="button"
        >
          Новый чат
        </button>
      </div>
    </div>
  );
}
