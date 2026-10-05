"use client";

import { useEffect } from "react";

let keepNext = false;

/** Call before a link that should keep the scroll position (e.g. switching pack size). */
export function keepScrollOnNextPage() {
  keepNext = true;
}

/**
 * Jump to the top when a detail page opens or switches item (``key``).
 * Detail pages render a spinner first, so Next's own scroll-to-top doesn't
 * reliably land at the top of the loaded page.
 */
export function useScrollToTop(key: string) {
  useEffect(() => {
    if (keepNext) {
      keepNext = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [key]);
}
