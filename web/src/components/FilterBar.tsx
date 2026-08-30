"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { displayBrandName } from "@/lib/brands";

type Props = {
  brands: string[];
  categories: { slug: string; name: string }[];
  layout?: "sidebar" | "inline";
};

export function FilterBar({ brands, categories, layout = "sidebar" }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const activeBrand = params.get("brand");
  const activeCategory = params.get("category");
  const inStock = params.get("in_stock");
  const query = params.get("q");

  function setParam(key: string, value: string | null) {
    const sp = new URLSearchParams(params.toString());
    sp.delete("cursor");
    if (value) sp.set(key, value);
    else sp.delete(key);
    router.push(`/catalog?${sp.toString()}`);
  }

  function clearAll() {
    router.push("/catalog");
  }

  const hasFilters = Boolean(activeBrand || activeCategory || inStock || query);

  const chipClass = (active: boolean) =>
    `w-full rounded-[10px] px-3 py-2.5 text-left text-sm font-medium transition-colors ${
      active ? "bg-black text-white" : "bg-[#f6f6f6] text-black hover:bg-[#ececec]"
    }`;

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-black">Фильтры</h2>
        {hasFilters && (
          <button type="button" onClick={clearAll} className="text-xs font-medium text-[var(--color-accent)]">
            Сбросить
          </button>
        )}
      </div>

      {query && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#717171]">Поиск</p>
          <p className="rounded-[10px] bg-[var(--color-accent-light)] px-3 py-2 text-sm font-medium text-[var(--color-accent-dark)]">
            «{query}»
          </p>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#717171]">Наличие</p>
        <button type="button" onClick={() => setParam("in_stock", inStock ? null : "true")} className={chipClass(Boolean(inStock))}>
          Только в наличии
        </button>
      </div>

      {categories.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#717171]">Категория</p>
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={() => setParam("category", null)} className={chipClass(!activeCategory)}>
              Все категории
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setParam("category", activeCategory === c.slug ? null : c.slug)}
                className={chipClass(activeCategory === c.slug)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {brands.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#717171]">Бренд</p>
          <div className="flex max-h-[320px] flex-col gap-1.5 overflow-y-auto pr-1">
            <button type="button" onClick={() => setParam("brand", null)} className={chipClass(!activeBrand)}>
              Все бренды
            </button>
            {brands.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setParam("brand", activeBrand === b ? null : b)}
                className={chipClass(activeBrand === b)}
              >
                {displayBrandName(b) ?? b}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (layout === "inline") {
    return <div className="rounded-[16px] bg-[#fafafa] p-4 lg:hidden">{content}</div>;
  }

  return (
    <aside className="sticky top-24 hidden w-[240px] shrink-0 self-start rounded-[16px] border border-black/5 bg-[#fafafa] p-4 lg:block">
      {content}
    </aside>
  );
}
