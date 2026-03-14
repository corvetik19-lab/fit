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
    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {sessionTitle?.trim() || "Новый чат"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label={
            allowWebSearch
              ? "Выключить поиск в интернете"
              : "Включить поиск в интернете"
          }
          aria-pressed={allowWebSearch}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
            allowWebSearch
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-border bg-white/80 text-muted hover:bg-white"
          }`}
          onClick={onToggleWebSearch}
          type="button"
        >
          <Globe size={18} strokeWidth={2.2} />
        </button>

        <button
          aria-label="Открыть шаблоны"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/80 text-foreground transition hover:bg-white"
          onClick={onOpenPromptLibrary}
          type="button"
        >
          <WandSparkles size={16} strokeWidth={2.1} />
        </button>

        <button
          aria-label="Выбрать фото еды"
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
            selectedImage
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-border bg-white/80 text-muted hover:bg-white"
          }`}
          disabled={!mealPhotoAccessAllowed}
          onClick={onOpenMealPhoto}
          type="button"
        >
          <ImagePlus size={18} strokeWidth={2.2} />
        </button>

        <button
          className="rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
          onClick={onReset}
          type="button"
        >
          Новый чат
        </button>
      </div>
    </div>
  );
}
