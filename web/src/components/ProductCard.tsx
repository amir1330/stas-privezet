"use client";

import Link from "next/link";
import { useState } from "react";

export function formatPrice(krw: number) {
  return `${Math.round(krw).toLocaleString("ru-RU").replace(/\s/g, " ")}\u00A0₩`;
}

function formatInstallment(krw: number) {
  const half = Math.round(krw / 2);
  return `${half.toLocaleString("ru-RU").replace(/\s/g, " ")}\u00A0₩ × 2 частями`;
}

export function ProductCard({
  product,
  variant = "carousel",
}: {
  product: {
    slug: string;
    title: string;
    price_krw: number | null;
    price_original_krw?: number | null;
    thumbnail_url: string | null;
  };
  variant?: "carousel" | "grid";
}) {
  const [liked, setLiked] = useState(false);
  const isCarousel = variant === "carousel";

  return (
    <Link
      href={`/product/${product.slug}`}
      prefetch={true}
      className={`anim-product-card group flex flex-col bg-white ${isCarousel ? "w-[172px] shrink-0" : "w-full"}`}
    >
      <div className={`relative flex items-center justify-center bg-white ${isCarousel ? "h-[112px]" : "aspect-[4/5]"}`}>
        {product.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="anim-product-image h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="text-xs text-gray-300">Нет фото</div>
        )}
        <button
          type="button"
          aria-label={liked ? "Снять лайк" : "Добавить в избранное"}
          onClick={(e) => {
            e.preventDefault();
            setLiked((v) => !v);
          }}
          className={`anim-fav-btn unicorn-fav-btn absolute right-0 top-0 ${liked ? "liked" : ""}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "#ff385c" : "none"} aria-hidden>
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              stroke={liked ? "#ff385c" : "#222"}
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>
      <div className="bg-white pt-1">
        {product.price_krw != null && (
          <>
            <div className="flex items-baseline gap-2">
              <p className="text-[20px] font-bold leading-tight text-black">
                {formatPrice(product.price_krw)}
              </p>
              {product.price_original_krw != null && product.price_original_krw > product.price_krw && (
                <p className="text-sm text-[#717171] line-through">
                  {formatPrice(product.price_original_krw)}
                </p>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-[#717171]">
              {formatInstallment(product.price_krw)}
            </p>
          </>
        )}
        <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-black">
          {product.title}
        </p>
      </div>
    </Link>
  );
}
