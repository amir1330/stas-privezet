"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiBase } from "@/lib/api";
import { formatPrice } from "@/components/ProductCard";
import { useProductChrome } from "@/lib/product-chrome";

interface Variant {
  id: string;
  size: string | null;
  price_krw: number | null;
  in_stock: boolean;
}

interface Image {
  cdn_url: string;
  width?: number | null;
  height?: number | null;
}

interface Spec {
  key: string | null;
  value: string | null;
  block_title?: string | null;
}

interface Props {
  productId: string;
  title: string;
  brand: string | null;
  categoryName: string | null;
  priceKrw: number | null;
  images: Image[];
  variants: Variant[];
  specs: Spec[];
}

const CATEGORY_PILLS = ["Одежда", "Верхняя одежда"];

export function ProductHeroClothing({
  productId,
  title,
  categoryName,
  priceKrw,
  images,
  variants,
  specs,
}: Props) {
  const { setBuyTriggerElement, setPurchase } = useProductChrome();
  const inStock = variants.filter((v) => v.in_stock);
  const [activeImage, setActiveImage] = useState(0);
  const [selected, setSelected] = useState<string | null>(inStock[0]?.size ?? null);
  const [liked, setLiked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const hero = images[activeImage] ?? images[0];
  const specRows = specs.filter((s) => s.key && s.value).slice(0, 14);

  const submitInquiry = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${getApiBase()}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_id: productId,
          contact_name: "Guest",
          contact_channel: selected ? `Size ${selected}` : undefined,
        }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }, [productId, selected]);

  useEffect(() => {
    setPurchase({
      selectedSize: selected,
      priceKrw,
      loading,
      submitted,
      onBuy: submitInquiry,
    });
  }, [selected, priceKrw, loading, submitted, submitInquiry, setPurchase]);

  return (
    <section className="unicorn-clothing-hero bg-white">
      <div className="mx-auto max-w-[1400px] px-[15px] pb-8 pt-6 lg:grid lg:grid-cols-2 lg:gap-12 lg:pb-12">
        <div className="lg:pt-8">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-extrabold leading-tight text-black md:text-4xl lg:text-[2.75rem] lg:leading-[1.05]">
              {title}
            </h1>
            <button
              type="button"
              aria-label={liked ? "Снять лайк" : "Добавить в избранное"}
              onClick={() => setLiked((v) => !v)}
              className={`anim-fav-btn unicorn-fav-btn shrink-0 transition-transform hover:scale-110 ${liked ? "liked" : ""}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "#ff385c" : "none"} aria-hidden>
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  stroke={liked ? "#ff385c" : "#222"}
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f8ef] px-2.5 py-1 text-xs font-semibold text-[#1a7f4b]">
              ✓ Оригинал
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[categoryName ?? CATEGORY_PILLS[0], ...CATEGORY_PILLS.slice(1)].filter(Boolean).slice(0, 3).map((pill) => (
              <span key={pill} className="rounded-full bg-[#f2f2f2] px-3 py-1.5 text-xs font-medium text-black">
                {pill}
              </span>
            ))}
          </div>

          {specRows.length > 0 && (
            <div className="mt-8 hidden overflow-x-auto lg:block">
              <div className="grid min-w-[640px] grid-cols-[repeat(14,minmax(0,1fr))] gap-x-3 gap-y-2 text-[11px]">
                {specRows.map((s) => (
                  <div key={s.key} className="text-[#717171]">
                    {s.key}
                  </div>
                ))}
                {specRows.map((s) => (
                  <div key={`${s.key}-v`} className="font-semibold text-black">
                    {s.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative mt-6 flex min-h-[320px] items-center justify-center lg:mt-0 lg:min-h-[480px]">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.cdn_url}
              alt={title}
              width={hero.width ?? 800}
              height={hero.height ?? 800}
              className="max-h-[min(55vh,520px)] w-auto max-w-full object-contain"
              fetchPriority="high"
            />
          ) : (
            <div className="text-gray-300">Нет фото</div>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <div className="mx-auto flex max-w-[1400px] justify-center gap-2 px-[15px] pb-4">
          {images.slice(0, 6).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveImage(i)}
              className={`h-12 w-12 overflow-hidden bg-white p-1 transition-all ${
                activeImage === i ? "ring-2 ring-[var(--color-accent)]" : "ring-1 ring-black/10"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.cdn_url} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-[1400px] px-[15px] pb-8">
        <div
          ref={setBuyTriggerElement}
          className="product-buy-trigger flex flex-col gap-4"
        >
          {inStock.length > 0 && (
            <div className="rounded-[16px] bg-[#f6f6f6] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Размер</span>
                <span className="text-xs text-[#717171]">EU</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {inStock.slice(0, 10).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelected(v.size)}
                    className={`min-w-[3rem] rounded-[10px] border px-3 py-2 text-sm font-semibold transition-all ${
                      selected === v.size
                        ? "border-[var(--color-accent)] bg-white text-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20"
                        : "border-transparent bg-white hover:border-[var(--color-accent)]/40"
                    }`}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#717171]">📏 Как определить размер одежды</p>
            </div>
          )}

          <div className="flex flex-row flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={loading || submitted}
              onClick={submitInquiry}
              className="unicorn-buy-pill disabled:opacity-60"
            >
              {priceKrw != null && <span className="unicorn-buy-pill-price">{formatPrice(priceKrw)}</span>}
              <span>{submitted ? "В корзине" : loading ? "…" : "В корзину"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
