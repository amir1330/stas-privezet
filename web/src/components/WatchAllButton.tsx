import Link from "next/link";

export function WatchAllButton({ href, label = "Смотреть все" }: { href: string; label?: string }) {
  return (
    <div className="px-[15px] pt-3">
      <Link
        href={href}
        className="anim-watch-all flex w-full items-center justify-center rounded-tile bg-[#efedec] py-4 text-sm font-bold text-black"
      >
        {label}
      </Link>
    </div>
  );
}
