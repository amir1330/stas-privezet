"use client";

import { ProductBuyRow } from "@/components/ProductBuyRow";

interface Variant {
  id: string;
  size: string | null;
  in_stock: boolean;
}

interface Spec {
  key: string;
  value: string;
}

interface Props {
  specRows: Spec[];
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
}

export function ProductActionCard({
  specRows,
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
}: Props) {
  return (
    <div className="product-action-card">
      {specRows.length > 0 && (
        <div className="product-action-specs product-specs-scroll">
          <div className="product-specs-row">
            {specRows.map((s) => (
              <div key={s.key} className="product-specs-item">
                <p className="product-specs-item__label">{s.key}</p>
                <p className="product-specs-item__value">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={specRows.length > 0 ? "pt-3 lg:pt-4" : undefined}>
        <ProductBuyRow
          inStock={inStock}
          selected={selected}
          onSelectSize={onSelectSize}
          priceKrw={priceKrw}
          loading={loading}
          submitted={submitted}
          liked={liked}
          onToggleLike={onToggleLike}
          onBuy={onBuy}
          buyTriggerRef={buyTriggerRef}
        />
      </div>
    </div>
  );
}
