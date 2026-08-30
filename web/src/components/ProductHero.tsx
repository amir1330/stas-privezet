"use client";

import { getProductHeroVariant } from "@/lib/category-images";
import { ProductHeroClothing } from "@/components/ProductHeroClothing";
import { ProductHeroSneaker } from "@/components/ProductHeroSneaker";

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

interface ProductHeroProps {
  productId: string;
  title: string;
  brand: string | null;
  categoryName: string | null;
  categorySlug?: string | null;
  priceKrw: number | null;
  isInStock: boolean;
  images: Image[];
  variants: Variant[];
  specs: { key: string; value: string }[];
}

export function ProductHero({
  productId,
  title,
  brand,
  categoryName,
  categorySlug,
  priceKrw,
  images,
  variants,
  specs,
}: ProductHeroProps) {
  const variant = getProductHeroVariant(title, categoryName, categorySlug);

  if (variant === "clothing") {
    return (
      <ProductHeroClothing
        productId={productId}
        title={title}
        brand={brand}
        categoryName={categoryName}
        priceKrw={priceKrw}
        images={images}
        variants={variants}
        specs={specs}
      />
    );
  }

  return (
    <ProductHeroSneaker
      productId={productId}
      title={title}
      brand={brand}
      priceKrw={priceKrw}
      images={images}
      variants={variants}
      specs={specs}
    />
  );
}
