"use client";

import { InstallmentBuyPill } from "@/components/product-buy/InstallmentBuyPill";
import { PriceDeliveryBox } from "@/components/product-buy/PriceDeliveryBox";

interface Props {
  isCompact: boolean;
  selectedSize: string | null;
  priceKrw: number | null;
  loading: boolean;
  submitted: boolean;
  onBuy: () => void;
}

export function StickyBuyBar({
  isCompact,
  selectedSize,
  priceKrw,
  loading,
  submitted,
  onBuy,
}: Props) {
  return (
    <div
      aria-hidden={!isCompact}
      className={[
        "product-sticky-bar fixed left-0 right-0 z-[60] bg-white/95 backdrop-blur-md",
        "transition-all duration-300 ease-in-out",
        "bottom-0 border-t border-black/5 shadow-[0_-4px_24px_rgba(15,17,23,0.08)]",
        isCompact ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
        "lg:bottom-auto lg:top-0 lg:border-b lg:border-t-0 lg:shadow-md",
        isCompact ? "lg:translate-y-0 lg:opacity-100" : "lg:-translate-y-full lg:opacity-0",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-4xl items-start gap-2 px-4 py-2 sm:items-center sm:gap-3 sm:px-6 lg:py-2.5">
        {selectedSize && (
          <div className="product-sticky-bar__size shrink-0">
            <span className="text-[10px] font-semibold uppercase text-[#717171]">EU</span>
            <span className="block text-sm font-bold text-black">{selectedSize}</span>
          </div>
        )}

        <PriceDeliveryBox priceKrw={priceKrw} compact />

        <InstallmentBuyPill
          priceKrw={priceKrw}
          installmentOn={false}
          onToggleInstallment={() => {}}
          loading={loading}
          submitted={submitted}
          onBuy={onBuy}
          compact
        />
      </div>
    </div>
  );
}
