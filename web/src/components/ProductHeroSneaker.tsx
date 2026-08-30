"use client";

import { useCallback, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logos";
import { ProductActionCard } from "@/components/ProductActionCard";
import { getApiBase } from "@/lib/api";
import { displayBrandName } from "@/lib/brands";
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
  key: string;
  value: string;
}

interface Props {
  productId: string;
  title: string;
  brand: string | null;
  priceKrw: number | null;
  images: Image[];
  variants: Variant[];
  specs: Spec[];
}

function showOffTitle(title: string) {
  const cleaned = title.replace(/^(кроссовки|кеды|сникеры)\s+/i, "");
  const words = cleaned.split(/\s+/);
  if (words.length <= 4) return cleaned;
  return words.slice(0, 4).join(" ");
}

const SPEC_ORDER = [
  "посадка",
  "сезон",
  "верх",
  "высота",
  "застеж",
  "носок",
  "каблук",
  "артикул",
  "дата",
  "стиль",
  "материал",
];

function sortSpecs(specs: Spec[]): Spec[] {
  return [...specs].sort((a, b) => {
    const ai = SPEC_ORDER.findIndex((k) => a.key.toLowerCase().includes(k));
    const bi = SPEC_ORDER.findIndex((k) => b.key.toLowerCase().includes(k));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export function ProductHeroSneaker({
  productId,
  title,
  brand,
  priceKrw,
  images,
  variants,
  specs,
}: Props) {
  const { setBuyTriggerElement, setPurchase } = useProductChrome();
  const inStock = variants.filter((v) => v.in_stock);
  const [selected, setSelected] = useState<string | null>(inStock[0]?.size ?? null);
  const [liked, setLiked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const heroImage = images[0];
  const extraImages = images.slice(1);
  const specRows = sortSpecs(specs.filter((s) => s.key && s.value)).slice(0, 12);
  const brandLabel = displayBrandName(brand);

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

  useEffect(() => {
    if (previewIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewIndex(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [previewIndex]);

  return (
    <>
      <section className="unicorn-product-hero">
        <div className="relative mx-auto max-w-[1400px] px-[15px] pb-6 pt-2 lg:px-8 lg:pb-10 lg:pt-4">
          <div className="product-sheet relative">
            <div className="unicorn-hero-stage">
              <div className="unicorn-hero-shoe-wrap">
                {heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroImage.cdn_url}
                    alt={title}
                    width={heroImage.width ?? 900}
                    height={heroImage.height ?? 900}
                    className="unicorn-hero-shoe max-h-[min(78vh,680px)] w-auto max-w-[min(108%,820px)] object-contain lg:max-h-[min(82vh,720px)] lg:max-w-[min(100%,760px)]"
                    fetchPriority="high"
                  />
                ) : (
                  <div className="text-gray-300">Нет фото</div>
                )}
              </div>

              <div className="unicorn-hero-copy">
                <div className="unicorn-hero-brand">
                  <span className="unicorn-original-badge">Оригинал ✓</span>
                  {brandLabel && (
                    <BrandLogo
                      name={brandLabel}
                      className="unicorn-hero-brand-mark fill-[var(--color-navy)] text-[var(--color-navy)]"
                    />
                  )}
                </div>

                <h1
                  className="unicorn-layered-title anim-layered-title pointer-events-none select-none"
                  aria-label={title}
                >
                  {showOffTitle(title)}
                </h1>
              </div>
            </div>

            <div className="relative z-10 mt-2 lg:mt-3">
              <ProductActionCard
                specRows={specRows}
                inStock={inStock}
                selected={selected}
                onSelectSize={setSelected}
                priceKrw={priceKrw}
                loading={loading}
                submitted={submitted}
                liked={liked}
                onToggleLike={() => setLiked((v) => !v)}
                onBuy={submitInquiry}
                buyTriggerRef={setBuyTriggerElement}
              />
            </div>
          </div>
        </div>
      </section>

      {extraImages.length > 0 && (
        <section className="border-t border-black/5 bg-white py-8 lg:py-10">
          <div className="mx-auto max-w-[1400px] px-[15px] lg:px-8">
            <div className="product-sheet">
              <h2 className="text-lg font-bold text-black lg:text-xl">Фото товара</h2>
              <p className="mt-1 text-sm text-[#717171]">Дополнительные ракурсы — главное фото не меняется</p>

              <div className="product-gallery-scroll mt-5 flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible xl:grid-cols-4">
                {extraImages.map((img, i) => (
                  <button
                    key={img.cdn_url}
                    type="button"
                    onClick={() => setPreviewIndex(i)}
                    className="group flex h-[220px] w-[min(78vw,280px)] shrink-0 flex-col overflow-hidden rounded-[20px] bg-[#f3f2f1] transition hover:shadow-md lg:h-auto lg:w-auto lg:min-h-[240px]"
                  >
                    <div className="flex flex-1 items-center justify-center p-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.cdn_url}
                        alt={`${title} — фото ${i + 2}`}
                        className="max-h-[180px] w-auto max-w-full object-contain transition duration-300 group-hover:scale-[1.03] lg:max-h-[200px]"
                        loading="lazy"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {previewIndex != null && extraImages[previewIndex] && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-label="Просмотр фото"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl"
            onClick={() => setPreviewIndex(null)}
            aria-label="Закрыть"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={extraImages[previewIndex].cdn_url}
            alt=""
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
