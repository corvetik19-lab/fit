"use client";

import { useCallback, useEffect, useState } from "react";

const WEB_SEARCH_STORAGE_KEY = "fit.ai.web-search";
const WEB_SEARCH_EVENT = "fit:ai:web-search";

function readWebSearchPreference() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(WEB_SEARCH_STORAGE_KEY) === "true";
}

export function useAiChatWebSearch() {
  const [allowWebSearch, setAllowWebSearch] = useState(() =>
    readWebSearchPreference(),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncFromStorage = () => {
      setAllowWebSearch(readWebSearchPreference());
    };

    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(WEB_SEARCH_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(WEB_SEARCH_EVENT, syncFromStorage);
    };
  }, []);

  const toggleWebSearch = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const next = !readWebSearchPreference();
    window.sessionStorage.setItem(WEB_SEARCH_STORAGE_KEY, next ? "true" : "false");
    setAllowWebSearch(next);
    window.dispatchEvent(new Event(WEB_SEARCH_EVENT));
  }, []);

  return {
    allowWebSearch,
    toggleWebSearch,
  };
}
