"use client";

import { Camera, ScanLine, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { parseOpenFoodFactsBarcode } from "@/lib/nutrition/open-food-facts";

type DetectedBarcode = {
  rawValue?: string;
};

type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
};

const barcodeFormats = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] as const;

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function NutritionBarcodeScanner({
  onClose,
  onDetected,
}: {
  onClose: () => void;
  onDetected: (barcode: string) => void;
}) {
  const detectorRef = useRef<InstanceType<BarcodeDetectorCtor> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isDetectingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [supportsLiveScanner, setSupportsLiveScanner] = useState(false);

  useEffect(() => {
    const BarcodeDetectorApi = (
      window as Window & { BarcodeDetector?: BarcodeDetectorCtor }
    ).BarcodeDetector;

    if (!navigator.mediaDevices?.getUserMedia || !BarcodeDetectorApi) {
      setSupportsLiveScanner(false);
      setError(
        "Live-сканер штрихкода недоступен в этом браузере. Можно выбрать фото упаковки или ввести код вручную.",
      );
      return;
    }

    setSupportsLiveScanner(true);
    detectorRef.current = new BarcodeDetectorApi({
      formats: [...barcodeFormats],
    });

    let isCancelled = false;

    async function startScanner() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (isCancelled) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;

        if (!video) {
          stopStream(stream);
          return;
        }

        video.srcObject = stream;
        await video.play();
        setError(null);
        setIsReady(true);

        intervalRef.current = window.setInterval(async () => {
          if (isDetectingRef.current || !videoRef.current || !detectorRef.current) {
            return;
          }

          isDetectingRef.current = true;

          try {
            const barcodes = await detectorRef.current.detect(videoRef.current);
            const firstBarcode = barcodes[0]?.rawValue;
            const normalizedBarcode = firstBarcode
              ? parseOpenFoodFactsBarcode(firstBarcode)
              : null;

            if (normalizedBarcode) {
              if (intervalRef.current !== null) {
                window.clearInterval(intervalRef.current);
              }
              stopStream(streamRef.current);
              streamRef.current = null;
              onDetected(normalizedBarcode);
            }
          } catch {
            // Ignore intermittent detector errors from partially loaded frames.
          } finally {
            isDetectingRef.current = false;
          }
        }, 500);
      } catch {
        setError(
          "Не удалось открыть камеру. Проверь доступ или выбери фото упаковки ниже.",
        );
      }
    }

    void startScanner();

    return () => {
      isCancelled = true;

      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }

      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [onDetected]);

  async function handleFileSelection(file: File | null) {
    if (!file) {
      return;
    }

    const BarcodeDetectorApi = (
      window as Window & { BarcodeDetector?: BarcodeDetectorCtor }
    ).BarcodeDetector;

    if (!BarcodeDetectorApi) {
      setError(
        "Этот браузер не умеет считывать штрихкод с фото. Попробуй live-сканер или введи код вручную.",
      );
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const detector = new BarcodeDetectorApi({
        formats: [...barcodeFormats],
      });
      const barcodes = await detector.detect(bitmap);
      const normalizedBarcode = parseOpenFoodFactsBarcode(
        barcodes[0]?.rawValue ?? "",
      );

      if (!normalizedBarcode) {
        setError(
          "Не удалось распознать штрихкод на фото. Сними упаковку ближе и без бликов.",
        );
        return;
      }

      onDetected(normalizedBarcode);
    } catch {
      setError(
        "Не удалось обработать фото упаковки. Попробуй ещё раз или введи штрихкод вручную.",
      );
    }
  }

  return (
    <div className="rounded-[1.4rem] border border-border bg-white p-3 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.3)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="workspace-kicker">Сканер штрихкода</p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            Наведи камеру на упаковку
          </h3>
          <p className="mt-1 text-sm leading-5 text-muted">
            Лучше всего работает на чётком кадре при хорошем свете.
          </p>
        </div>
        <button
          aria-label="Закрыть сканер"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground transition hover:bg-[color:var(--surface-elevated)]"
          onClick={onClose}
          type="button"
        >
          <X size={17} strokeWidth={2.2} />
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-border bg-slate-950">
        {supportsLiveScanner ? (
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <video
              autoPlay
              className="h-full w-full object-cover"
              muted
              playsInline
              ref={videoRef}
            />
            <div className="pointer-events-none absolute inset-0 border-[14px] border-slate-950/40" />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-[1.25rem] border-2 border-teal-300/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.28)]" />
            <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-2 text-xs font-medium text-white">
              <ScanLine size={14} strokeWidth={2.2} />
              {isReady ? "Сканирую..." : "Подключаю камеру..."}
            </div>
          </div>
        ) : (
          <div className="flex aspect-[4/5] flex-col items-center justify-center gap-3 px-6 text-center text-white/80">
            <Camera size={28} strokeWidth={2.1} />
            <p className="text-sm leading-6">
              Live-сканер недоступен. Ниже можно выбрать фото упаковки.
            </p>
          </div>
        )}
      </div>

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 shrink-0" size={16} strokeWidth={2.2} />
          <p>{error}</p>
        </div>
      ) : null}

      <input
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void handleFileSelection(event.target.files?.[0] ?? null)}
        ref={fileInputRef}
        type="file"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="action-button action-button--secondary px-4 py-2.5 text-sm"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          Считать с фото
        </button>
      </div>
    </div>
  );
}
