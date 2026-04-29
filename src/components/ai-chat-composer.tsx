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
      className="surface-panel mt-3 p-3"
      id="ai-chat-composer"
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
              className="h-14 w-14 rounded-2xl object-cover"
              height={56}
              src={selectedImageUrl}
              unoptimized
              width={56}
            />
          ) : null}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {selectedImage.name}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              AI разберёт фото и сохранит результат в текущей сессии.
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
        className="min-h-28 w-full resize-none rounded-[1.25rem] border border-border bg-white px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
        data-testid="ai-chat-composer"
        disabled={!accessAllowed}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={
          selectedImage
            ? "Например: это ужин после тренировки, оцени состав и подскажи, как улучшить."
            : "Спроси AI-коуча про питание, тренировку, прогресс или план."
        }
        ref={composerRef}
        value={draft}
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-xs leading-5 text-muted">
          {selectedImage
            ? "Фото будет проанализировано перед ответом."
            : allowWebSearch
              ? "Поиск в интернете включён."
              : "Поиск в интернете выключен."}
        </p>

        <div className="flex shrink-0 gap-2">
          {isBusy ? (
            <button
              className="toggle-chip px-3 py-2 text-xs font-semibold"
              data-testid="ai-chat-stop"
              onClick={onStop}
              type="button"
            >
              <Square size={15} strokeWidth={2.2} />
              Стоп
            </button>
          ) : null}

          <button
            className="toggle-chip toggle-chip--active px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
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
                <LoaderCircle className="animate-spin" size={15} />
              ) : null}
              {selectedImage
                ? isAnalyzingImage
                  ? "Анализ..."
                  : "Разобрать"
                : isBusy
                  ? "Думаю..."
                  : "Отправить"}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
