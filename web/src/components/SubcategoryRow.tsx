import Link from "next/link";

type Tile = { name: string; href: string; thumb?: string | null };

export function SubcategoryRow({
  items,
  href,
  thumbs = [],
  tiles,
}: {
  items: string[];
  href: string;
  thumbs?: (string | null)[];
  tiles?: Tile[];
}) {
  const resolved = tiles ?? items.map((name, i) => ({
    name,
    href,
    thumb: thumbs[i % thumbs.length] ?? null,
  }));

  return (
    <div className="subcategory-scroll mt-3 flex gap-2 overflow-x-auto px-[15px] pb-1">
      {resolved.map((tile) => (
        <Link
          key={tile.name}
          href={tile.href}
          className="tile-hover flex w-[80px] shrink-0 flex-col items-center text-center"
        >
          <div className="relative flex h-[80px] w-[80px] items-end justify-center overflow-hidden rounded-[14px] bg-[#efedec]">
            {tile.thumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tile.thumb}
                alt=""
                className="absolute inset-0 h-full w-full object-contain p-1 transition-transform duration-300"
                loading="lazy"
              />
            )}
          </div>
          <span className="mt-1.5 text-[11px] font-bold leading-tight text-black">{tile.name}</span>
        </Link>
      ))}
    </div>
  );
}
