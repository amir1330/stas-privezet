"use client";

import { formatPrice } from "@/components/ProductCard";

interface Props {
  priceKrw: number | null;
  installmentOn: boolean;
  onToggleInstallment: () => void;
  loading: boolean;
  submitted: boolean;
  onBuy: () => void;
  compact?: boolean;
}

export function InstallmentBuyPill({
  priceKrw,
  installmentOn,
  onToggleInstallment,
  loading,
  submitted,
  onBuy,
  compact,
}: Props) {
  const installmentPart = priceKrw != null ? Math.round(priceKrw / 2) : null;

  return (
    <div className={`product-installment-pill shrink-0 ${compact ? "product-installment-pill--compact" : ""}`}>
      {!compact && (
        <label className="product-installment-pill__toggle">
          <input
            type="checkbox"
            checked={installmentOn}
            onChange={onToggleInstallment}
            className="product-installment-pill__checkbox"
          />
          <span className="product-installment-pill__toggle-track" aria-hidden />
          <span className="product-installment-pill__toggle-label">
            {installmentPart != null
              ? `Частями: ${formatPrice(installmentPart)}, остаток потом`
              : "Частями: оплата в два этапа"}
          </span>
        </label>
      )}

      <button
        type="button"
        disabled={loading || submitted}
        onClick={onBuy}
        className="product-installment-pill__buy"
      >
        {priceKrw != null && (
          <span className="product-installment-pill__buy-price">{formatPrice(priceKrw)}</span>
        )}
        <span>{submitted ? "В корзине" : loading ? "…" : "В корзину"}</span>
      </button>
    </div>
  );
}
