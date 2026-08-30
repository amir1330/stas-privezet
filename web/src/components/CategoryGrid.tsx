import Link from "next/link";

type Tile = { name: string; href: string; thumb?: string | null; large?: boolean };

export function CategoryGrid({ tiles }: { tiles: Tile[]; href?: string }) {
  const main = tiles.slice(0, 3);
  const bottom = tiles.slice(3, 6);

  return (
    <div className="px-[15px]">
      <div className="unicorn-cat-grid">
        {main.map((tile, i) => (
          <CategoryTile key={tile.name} tile={tile} large={i === 0} />
        ))}
        {bottom.length > 0 && (
          <div className="unicorn-cat-row3">
            {bottom.map((tile) => (
              <CategoryTile key={tile.name} tile={tile} small />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryTile({
  tile,
  large,
  small,
}: {
  tile: Tile;
  large?: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={tile.href}
      className={`unicorn-tile tile-hover block ${large ? "unicorn-cat-large" : small ? "unicorn-cat-small" : "unicorn-cat-medium"}`}
    >
      {tile.thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tile.thumb}
          alt=""
          className={
            large
              ? "absolute bottom-0 right-[-8%] h-[88%] w-[72%] object-contain transition-transform duration-500"
              : small
                ? "absolute bottom-0 right-0 h-[78%] w-[80%] object-contain transition-transform duration-500"
                : "absolute bottom-0 right-0 h-[82%] w-[75%] object-contain transition-transform duration-500"
          }
          loading="lazy"
        />
      )}
      <span
        className={`absolute z-10 whitespace-pre-line font-bold leading-tight text-black ${
          large ? "left-3 top-3 text-sm" : small ? "bottom-2 left-2 text-[10px]" : "left-2 top-2 text-[11px]"
        }`}
        style={{ maxWidth: large ? "48%" : "58%" }}
      >
        {tile.name.replace(" и ", "\nи ")}
      </span>
    </Link>
  );
}
