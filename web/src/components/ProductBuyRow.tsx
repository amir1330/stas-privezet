"use client";

import { useState } from "react";
import { InstallmentBuyPill } from "@/components/product-buy/InstallmentBuyPill";
import { PriceDeliveryBox } from "@/components/product-buy/PriceDeliveryBox";
import { SizeGuideLinks } from "@/components/product-buy/SizeGuideLinks";
import { SizeSelector } from "@/components/product-buy/SizeSelector";

interface Variant {
  id: string;
  size: string | null;
  in_stock: boolean;
}

interface Props {
  inStock: Variant[];
  selected: string | null;
  onSelectSize: (size: string | null) => void;
  priceKrw: number | null;
  loading: boolean;
  submitted: boolean;
  liked: boolean;
  onToggleLike: () => void;
  onBuy: () => void;
  buyTriggerRef?: (el: HTMLElement | null) => void;
  sizeGuideVariant?: "shoe" | "clothing";
}

export function ProductBuyRow({
  inStock,
  selected,
  onSelectSize,
  priceKrw,
  loading,
  submitted,
  liked,
  onToggleLike,
  onBuy,
  buyTriggerRef,
  sizeGuideVariant = "shoe",
}: Props) {
  const [installmentOn, setInstallmentOn] = useState(false);

  return (
    <div className="product-buy-block">
      <SizeSelector variants={inStock} selected={selected} onSelectSize={onSelectSize} />

      <div ref={buyTriggerRef} className="product-buy-trigger">
        <div className="product-buy-row">
          <PriceDeliveryBox priceKrw={priceKrw} />

          <InstallmentBuyPill
            priceKrw={priceKrw}
            installmentOn={installmentOn}
            onToggleInstallment={() => setInstallmentOn((v) => !v)}
            loading={loading}
            submitted={submitted}
            onBuy={onBuy}
          />

          <button
            type="button"
            aria-label={liked ? "Снять лайк" : "Добавить в избранное"}
            onClick={onToggleLike}
            className={`anim-fav-btn product-buy-fav shrink-0 ${liked ? "liked" : ""}`}
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

        <SizeGuideLinks variant={sizeGuideVariant} />
      </div>
    </div>
  );
}
