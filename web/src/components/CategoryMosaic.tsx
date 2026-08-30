import Link from "next/link";
import type { ProductListItem } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

type Category = { id: string; name: string; slug: string };

export function CategoryMosaic({
  categories,
  products,
}: {
  categories: Category[];
  products: ProductListItem[];
}) {
  if (categories.length === 0) return null;

  const thumbs = products.filter((p) => p.thumbnail_url).slice(0, 6);

  return (
    <Reveal>
      <section className="px-4 py-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">Категории</h2>
          <Link href="/catalog" className="btn-glass flex items-center gap-1 !py-2">
            Все
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden>
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="m8.25 5.5 5.5 5.5-5.5 5.5"
              />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 lg:gap-4">
          {categories.slice(0, 4).map((c, i) => {
            const thumb = thumbs[i]?.thumbnail_url;
            const isLarge = i === 0;
            return (
              <Link
                key={c.slug}
                href={`/catalog?category=${c.slug}`}
                className={`promo-tile group relative overflow-hidden bg-[#efedec] ${
                  isLarge
                    ? "col-span-2 row-span-2 aspect-square sm:aspect-auto sm:min-h-[280px]"
                    : "aspect-[4/3]"
                }`}
                style={{ animation: `scale-in 0.5s ease-out ${i * 0.08}s both` }}
              >
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className={`absolute object-contain transition duration-500 group-hover:scale-110 ${
                      isLarge
                        ? "right-[-5%] top-1/2 h-[85%] w-[70%] -translate-y-1/2 group-hover:-rotate-2"
                        : "bottom-0 right-0 h-[75%] w-[65%] group-hover:-rotate-3"
                    }`}
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-violet/20 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                <span className="absolute bottom-4 left-4 text-base font-bold text-ink sm:text-lg">
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </Reveal>
  );
}
