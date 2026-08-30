import type { ProductListItem } from "@/lib/api";
import { ProductCarousel } from "@/components/ProductCarousel";
import { WatchAllButton } from "@/components/WatchAllButton";

export function PickupToday({ products }: { products: ProductListItem[] }) {
  const picks = products.slice(0, 10);
  if (picks.length === 0) return null;

  return (
    <section className="pb-6">
      <div className="mb-1 px-[15px]">
        <h2 className="unicorn-section-title">Забрать сегодня</h2>
        <p className="mt-2 text-sm text-[#717171] leading-relaxed">
          Самовывоз из магазина в Москве или доставка СДЭКом в любой город РФ
        </p>
      </div>

      <ProductCarousel title="" products={picks} seeAllHref="/catalog?in_stock=true" />

      <WatchAllButton href="/catalog?in_stock=true" label="Смотреть все кроссовки" />
    </section>
  );
}
