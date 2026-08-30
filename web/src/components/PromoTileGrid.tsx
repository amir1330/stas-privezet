import Link from "next/link";
import type { ProductListItem } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

const TILES = [
  { label: "Кроссовки", sub: "в каталоге", href: "/catalog", slug: "sneakers" },
  { label: "В наличии", sub: "сейчас", href: "/catalog?in_stock=true", slug: "stock" },
  { label: "Новинки", sub: "свежие", href: "/catalog", slug: "new" },
];

export function PromoTileGrid({ products }: { products: ProductListItem[] }) {
  const thumbs = products.filter((p) => p.thumbnail_url).slice(0, 3);

  return (
    <section className="px-4 py-4 lg:px-8">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
        {TILES.map((tile, i) => {
          const thumb = thumbs[i]?.thumbnail_url;
          const isWide = i === 0;
          return (
            <Reveal key={tile.slug} delay={i * 80} className={isWide ? "col-span-2 lg:col-span-1" : ""}>
              <Link
                href={tile.href}
                className={`promo-tile group flex bg-[#efedec] ${
                  isWide ? "min-h-[140px] sm:min-h-[160px]" : "min-h-[120px]"
                }`}
              >
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="absolute bottom-0 right-0 h-[90%] w-[55%] object-contain transition duration-500 group-hover:scale-110 group-hover:-rotate-3"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-violet/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="relative z-10 flex flex-col justify-end p-4">
                  <span className="text-base font-bold text-ink sm:text-lg">{tile.label}</span>
                  <span className="text-xs text-gray-500">{tile.sub}</span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
