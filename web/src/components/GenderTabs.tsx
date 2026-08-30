"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Tab = "men" | "women";

const TABS: { id: Tab; label: string }[] = [
  { id: "men", label: "Мужчинам" },
  { id: "women", label: "Женщинам" },
];

export function GenderTabs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ men: null, women: null });
  const [active, setActive] = useState<Tab>("men");
  const [pill, setPill] = useState({ width: 0, left: 0 });

  const updatePill = useCallback(() => {
    const el = tabRefs.current[active];
    const box = containerRef.current;
    if (!el || !box) return;
    const boxRect = box.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setPill({ width: elRect.width, left: elRect.left - boxRect.left });
  }, [active]);

  useEffect(() => {
    updatePill();
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [updatePill]);

  return (
    <div className="px-[15px] pb-4">
      <div ref={containerRef} className="unicorn-gender-tabs relative">
        <span
          className="anim-gender-pill"
          style={{ width: pill.width, transform: `translateX(${pill.left}px)` }}
          aria-hidden
        />
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(node) => {
              tabRefs.current[tab.id] = node;
            }}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`anim-gender-tab unicorn-gender-tab relative z-10 w-full ${
              active === tab.id ? "unicorn-gender-tab-active" : ""
            }`}
            aria-pressed={active === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
