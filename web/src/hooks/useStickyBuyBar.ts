"use client";

import { useEffect, useState } from "react";

/**
 * Tracks when the in-flow buy block leaves the viewport (IntersectionObserver).
 * Returns true when the compact sticky buy bar should be shown.
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
        // Compact when the buy block is fully above the viewport
        setIsCompact(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(triggerEl);
    return () => observer.disconnect();
  }, [triggerEl]);

  return isCompact;
}
