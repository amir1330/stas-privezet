import Link from "next/link";
import { BrandLogo } from "@/components/brand-logos";

const DEFAULT_BRANDS = [
  "Nike",
  "New Balance",
  "Adidas",
  "Jordan",
  "Asics",
  "Stone Island",
  "Puma",
  "Converse",
  "Vans",
];

export function BrandGrid({ brands: _brands }: { brands: string[] }) {
  const display = DEFAULT_BRANDS;

  return (
    <section className="py-3">
      <div className="brand-scroll flex gap-4 overflow-x-auto px-[15px]">
        {display.map((brand, i) => (
          <Link
            key={brand}
            href={`/catalog?brand=${encodeURIComponent(brand)}`}
            className="anim-brand-item flex w-[72px] shrink-0 flex-col items-center gap-2"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <BrandLogo name={brand} className="h-12 w-[72px] fill-black text-black" />
            <h3 className="text-center text-sm font-normal text-black">{brand}</h3>
          </Link>
        ))}
        <Link href="/catalog" className="flex w-[72px] shrink-0 flex-col items-center gap-2">
          <BrandLogo name="Все бренды" className="h-12 w-[72px] text-black" />
          <h3 className="text-center text-sm font-normal text-black">Все бренды</h3>
        </Link>
      </div>
    </section>
  );
}
