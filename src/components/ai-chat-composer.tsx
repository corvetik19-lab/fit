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
      className="mt-4 rounded-[1.75rem] border border-border bg-white/85 p-3 sm:p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {selectedImage ? (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-white/90 p-3">
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
              Сначала AI разберет фото, потом можно попросить рецепт, замену или
              план питания.
            </p>
          </div>

          <button
            aria-label="Убрать фото"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/80 text-muted transition hover:bg-white"
            onClick={onClearSelectedImage}
            type="button"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
      ) : null}

      <textarea
        className="min-h-28 w-full resize-none rounded-3xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!accessAllowed}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={
          selectedImage
            ? "Например: это мой ужин после тренировки, оцени состав и подскажи, как улучшить."
            : "Напиши вопрос, задачу или попроси собрать программу."
        }
        ref={composerRef}
        value={draft}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {selectedImage
            ? "Фото будет проанализировано и сохранено в историю этого чата."
            : allowWebSearch
              ? "Поиск в интернете включен."
              : "Поиск в интернете выключен."}
        </p>

        <div className="flex flex-wrap gap-2">
          {isBusy ? (
            <button
              className="rounded-full border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-white/80"
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
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
