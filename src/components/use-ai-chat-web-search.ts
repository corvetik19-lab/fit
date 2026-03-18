"use client";

import { useCallback, useSyncExternalStore } from "react";

const subscribeToHydration = () => () => {};
const WEB_SEARCH_STORAGE_KEY = "fit.ai.web-search";
const WEB_SEARCH_EVENT = "fit:ai:web-search";

function subscribeToWebSearch(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener("storage", handleChange);
  window.addEventListener(WEB_SEARCH_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(WEB_SEARCH_EVENT, handleChange);
  };
}

function getWebSearchSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(WEB_SEARCH_STORAGE_KEY) === "true";
}

export function useAiChatWebSearch() {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const allowWebSearch = useSyncExternalStore(
    subscribeToWebSearch,
    getWebSearchSnapshot,
    () => false,
  );

  const toggleWebSearch = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const next = !allowWebSearch;
    window.sessionStorage.setItem(
      WEB_SEARCH_STORAGE_KEY,
      next ? "true" : "false",
    );
    window.dispatchEvent(new Event(WEB_SEARCH_EVENT));
  }, [allowWebSearch]);

  return {
    allowWebSearch,
    isHydrated,
    toggleWebSearch,
  };
}
