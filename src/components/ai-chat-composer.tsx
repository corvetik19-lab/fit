"use client";

import Image from "next/image";
import { LoaderCircle, Square, X } from "lucide-react";
import type { KeyboardEventHandler, RefObject } from "react";

type AiChatComposerProps = {
  accessAllowed: boolean;
  allowWebSearch: boolean;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  isAnalyzingImage: boolean;
  isBusy: boolean;
  isComposerBusy: boolean;
  mealPhotoAccessAllowed: boolean;
  onClearSelectedImage: () => void;
  onDraftChange: (value: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
  onStop: () => void;
  onSubmit: () => void;
  selectedImage: File | null;
  selectedImageUrl: string | null;
};

export function AiChatComposer({
  accessAllowed,
  allowWebSearch,
  composerRef,
  draft,
  isAnalyzingImage,
  isBusy,
  isComposerBusy,
  mealPhotoAccessAllowed,
  onClearSelectedImage,
  onDraftChange,
  onKeyDown,
  onStop,
  onSubmit,
  selectedImage,
  selectedImageUrl,
}: AiChatComposerProps) {
  return (
    <form
      className="surface-panel mt-4 p-3 sm:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {selectedImage ? (
        <div className="surface-panel surface-panel--accent mb-3 flex items-center gap-3 p-3">
          {selectedImageUrl ? (
            <Image
              alt="Выбранное фото еды"
              className="h-16 w-16 rounded-2xl object-cover"
              height={64}
              src={selectedImageUrl}
              unoptimized
              width={64}
            />
          ) : null}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {selectedImage.name}
            </p>
            <p className="mt-1 text-xs text-muted">
              Сначала AI разберёт фото, потом можно попросить рецепт, замену
              продуктов или план питания.
            </p>
          </div>

          <button
            aria-label="Убрать фото"
            className="chat-toolbar-button"
            onClick={onClearSelectedImage}
            type="button"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
      ) : null}

      <textarea
        className="min-h-32 w-full resize-none rounded-[1.7rem] border border-border bg-white/88 px-4 py-4 text-sm leading-7 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
        data-testid="ai-chat-composer"
        disabled={!accessAllowed}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={
          selectedImage
            ? "Например: это мой ужин после тренировки, оцени состав и подскажи, как улучшить."
            : "Напиши задачу, вопрос или попроси собрать программу."
        }
        ref={composerRef}
        value={draft}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="workspace-kicker">Что будет дальше</p>
          <p className="mt-1 text-sm text-muted">
          {selectedImage
            ? "Фото будет проанализировано и сохранено в истории этого чата."
            : allowWebSearch
              ? "Поиск в интернете включён."
              : "Поиск в интернете выключен."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isBusy ? (
            <button
              className="toggle-chip px-4 py-3 text-sm font-semibold"
              data-testid="ai-chat-stop"
              onClick={onStop}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <Square size={16} strokeWidth={2.2} />
                Остановить
              </span>
            </button>
          ) : null}

          <button
            className="toggle-chip toggle-chip--active px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="ai-chat-submit"
            disabled={
              isComposerBusy ||
              (!selectedImage && !draft.trim()) ||
              (selectedImage && !mealPhotoAccessAllowed) ||
              !accessAllowed
            }
            type="submit"
          >
            <span className="inline-flex items-center gap-2">
              {isComposerBusy ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : null}
              {selectedImage
                ? isAnalyzingImage
                  ? "Анализирую фото..."
                  : "Разобрать фото"
                : isBusy
                  ? "Отправляю..."
                  : "Отправить"}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
