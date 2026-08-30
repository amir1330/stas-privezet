"use client";

import { useRef, useState } from "react";

interface Variant {
  id: string;
  size: string | null;
  in_stock: boolean;
}

interface Props {
  variants: Variant[];
  selected: string | null;
  onSelectSize: (size: string | null) => void;
}

export function SizeSelector({ variants, selected, onSelectSize }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  if (variants.length === 0) return null;

  const visible = expanded ? variants : variants.slice(0, 8);
  const hasMore = variants.length > 8;

  return (
    <div className="product-size-bar">
      <span className="product-size-bar__label">EU</span>
      <div ref={scrollRef} className="product-size-bar__scroll product-purchase-sizes-scroll">
        {visible.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelectSize(v.size)}
            className={`product-size-bar__item ${selected === v.size ? "product-size-bar__item--active" : ""}`}
          >
            {v.size}
          </button>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          aria-label={expanded ? "Свернуть размеры" : "Показать все размеры"}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="product-size-bar__chevron"
        >
          {expanded ? "▲" : "▼"}
        </button>
      )}
    </div>
  );
}
