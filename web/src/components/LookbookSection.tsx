import Link from "next/link";
import type { ProductListItem } from "@/lib/api";
import { WatchAllButton } from "@/components/WatchAllButton";

const LOOKS = [
  { title: "Игривая свежесть", count: "5 вещей" },
  { title: "Многослойный Smart", count: "7 вещей" },
  { title: "Образ в светлых тонах", count: "6 вещей" },
  { title: "Современный Silver", count: "4 вещи" },
  { title: "Французский дерзкий sportif", count: "6 вещей" },
  { title: "Лук с серым бомбером", count: "5 вещей" },
];

export function LookbookSection({
  products,
  href = "/catalog",
}: {
  products: ProductListItem[];
  href?: string;
}) {
  const thumbs = products.filter((p) => p.thumbnail_url).map((p) => p.thumbnail_url);

  return (
    <section className="pb-6">
      <div className="mb-3 flex items-center justify-between px-[15px]">
        <h2 className="unicorn-section-title">Образы от стилиста</h2>
      </div>

      <div className="product-scroll flex gap-2 overflow-x-auto px-[15px]">
        {LOOKS.map((look, i) => (
          <Link
            key={look.title}
            href={href}
            className="anim-lookbook-card relative h-[200px] w-[150px] shrink-0 overflow-hidden rounded-tile bg-[#efedec]"
          >
            {thumbs[i % thumbs.length] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbs[i % thumbs.length]!}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-90"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="text-xs font-bold leading-tight">{look.title}</p>
              <p className="mt-0.5 text-[10px] opacity-80">{look.count}</p>
            </div>
          </Link>
        ))}
      </div>

      <WatchAllButton href={href} />
    </section>
  );
}
