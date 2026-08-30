"use client";

import { formatPrice } from "@/components/ProductCard";

interface Props {
  priceKrw: number | null;
  deliveryLabel?: string;
  compact?: boolean;
}

export function PriceDeliveryBox({ priceKrw, deliveryLabel = "15–19 дней", compact }: Props) {
  if (priceKrw == null) return null;

  return (
    <div className={`product-price-box shrink-0 ${compact ? "product-price-box--compact" : ""}`}>
      <p className="product-price-box__amount">{formatPrice(priceKrw)}</p>
      <p className="product-price-box__delivery">/ {deliveryLabel}</p>
    </div>
  );
}
