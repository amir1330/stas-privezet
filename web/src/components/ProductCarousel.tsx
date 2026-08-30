"use client";

import { useRef } from "react";
import type { ProductListItem } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { SeeAllButton } from "@/components/SeeAllButton";

export function ProductCarousel({
  title,
  products,
  seeAllHref = "/catalog",
}: {
  title: string;
  products: ProductListItem[];
  seeAllHref?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  return (
    <section className="pb-4">
      {title && (
        <div className="mb-2 flex items-center justify-between px-[15px]">
          <h3 className="text-base font-bold text-black">{title}</h3>
          <SeeAllButton href={seeAllHref} />
        </div>
      )}
      <div ref={scrollRef} className="product-scroll flex gap-2 overflow-x-auto px-[15px]">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
