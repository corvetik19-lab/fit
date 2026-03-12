"use client";

import { useEffect } from "react";

import {
  cleanupStaleOfflineState,
  flushOfflineMutations,
} from "@/lib/offline/workout-sync";

const SYNC_INTERVAL_MS = 60 * 1000;

async function runSyncPass() {
  await cleanupStaleOfflineState();

  if (typeof navigator !== "undefined" && navigator.onLine) {
    await flushOfflineMutations();
  }
}

export function WorkoutSyncMonitor() {
  useEffect(() => {
    let isDisposed = false;

    async function safeRunSyncPass() {
      if (isDisposed) {
        return;
      }

      try {
        await runSyncPass();
      } catch {
        // Silent background retry: workout screens already surface actionable errors.
      }
    }

    function handleOnline() {
      void safeRunSyncPass();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void safeRunSyncPass();
      }
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void safeRunSyncPass();
      }
    }, SYNC_INTERVAL_MS);

    void safeRunSyncPass();

    return () => {
      isDisposed = true;
      window.clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
