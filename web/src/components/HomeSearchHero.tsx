"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/lib/locale";

export function HomeSearchHero() {
  const [q, setQ] = useState("");
  const router = useRouter();
  const { t } = useLocale();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <section className="unicorn-hero pt-[34px]">
      <h1 className="unicorn-hero-title anim-hero-title">{t("heroTitle")}</h1>

      <form onSubmit={submit} className="unicorn-search anim-search-shimmer">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#8d8d9a]" aria-hidden>
          <path
            fill="currentColor"
            d="M23.73 22.415 17.82 16.5a2.527 2.527 0 0 1-.44-2.967A9.196 9.196 0 0 0 18.442 9.3a9.2 9.2 0 0 0-9.098-9.3C4.153-.067-.067 4.159 0 9.354a9.2 9.2 0 0 0 9.31 9.108 9.168 9.168 0 0 0 4.234-1.076 2.52 2.52 0 0 1 2.972.436l5.9 5.906a.93.93 0 0 0 1.312-1.313Zm-19.717-7.97a7.33 7.33 0 0 1-2.157-5.213 7.33 7.33 0 0 1 2.157-5.214 7.313 7.313 0 0 1 5.208-2.16c1.967 0 3.817.767 5.208 2.16a7.33 7.33 0 0 1 2.157 5.214c0 1.97-.766 3.821-2.157 5.214a7.313 7.313 0 0 1-5.208 2.16 7.313 7.313 0 0 1-5.208-2.16Z"
          />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8d8d9a]"
        />
      </form>
    </section>
  );
}
