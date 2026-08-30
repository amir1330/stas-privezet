"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductListItem } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { SeeAllButton } from "@/components/SeeAllButton";

const CURATORS = [
  { id: "1", name: "Букер", handle: "@fedyabooker", display: "FEDYABOOKER" },
  { id: "2", name: "Sigma Boy", handle: "@sigmaboy", display: "SIGMABOY" },
  { id: "3", name: "Пирожников", handle: "@pirozhnikov", display: "PIROZHNIKOV" },
  { id: "4", name: "Magic Man", handle: "@magicman", display: "MAGIC MAN" },
];

export function CuratedPicks({ products }: { products: ProductListItem[] }) {
  const [active, setActive] = useState(CURATORS[0].id);
  const picks = products.slice(0, 10);
  const curator = CURATORS.find((c) => c.id === active) ?? CURATORS[0];

  if (picks.length === 0) return null;

  return (
    <section className="px-[15px] py-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="unicorn-section-title">
            Авторские подборки <span aria-hidden>👑</span>
          </h2>
          <p className="mt-2 text-sm text-[#717171] leading-relaxed">
            Это – рубрика, в которой популярные инфлюенсеры делятся понравившимися вещами, которые сами носят.
          </p>
        </div>
        <SeeAllButton href="/catalog" />
      </div>

      <div className="curator-scroll flex gap-3 overflow-x-auto pb-3">
        {CURATORS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            className={`anim-curator-btn flex shrink-0 flex-col items-center gap-1.5 ${active === c.id ? "active" : ""}`}
          >
            <span
              className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-xs font-bold ${
                active === c.id ? "ring-2 ring-black ring-offset-2" : "bg-[#efedec]"
              }`}
            >
              {c.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="max-w-[72px] truncate text-[10px] font-medium">{c.name}</span>
          </button>
        ))}
      </div>

      <div key={active} className="anim-curator-content overflow-hidden rounded-tile bg-[#efedec]">
        <div className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[#717171]">
            Подборка одежды и обуви от {curator.name}
          </p>
          <p className="mt-3 text-sm text-[#717171] leading-relaxed">
            В этой подборке — крутые кроссовки, модные вещи и актуальные хиты, которые носят сами кураторы.
          </p>
          <p className="mt-4 text-sm font-extrabold uppercase tracking-wide">{curator.display}</p>
          <p className="text-sm text-[#717171]">{curator.handle}</p>
          <Link
            href="/catalog"
            className="anim-black-cta mt-4 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
          >
            Открыть подборку
          </Link>
        </div>
        <div className="product-scroll flex gap-2 overflow-x-auto px-4 pb-4">
          {picks.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
