"use client";

import { useEffect, useState } from "react";

/** px gap between show/hide thresholds to prevent IO flicker at the boundary */
const COMPACT_ON_BELOW = -12;
const COMPACT_OFF_ABOVE = 12;

/**
 * Tracks when the in-flow buy block leaves the viewport (IntersectionObserver).
 * Uses hysteresis so isCompact does not flicker at the scroll boundary.
 */
export function useStickyBuyBar(triggerEl: HTMLElement | null): boolean {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (!triggerEl) {
      setIsCompact(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const top = entry.boundingClientRect.top;
        setIsCompact((prev) => {
          if (!prev && !entry.isIntersecting && top < COMPACT_ON_BELOW) return true;
          if (prev && (entry.isIntersecting || top > COMPACT_OFF_ABOVE)) return false;
          return prev;
        });
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(triggerEl);
    return () => observer.disconnect();
  }, [triggerEl]);

  return isCompact;
}
