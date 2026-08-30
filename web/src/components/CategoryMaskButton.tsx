import Link from "next/link";

/** Product-shaped category button using CSS mask-image on transparent PNG cutout. */
export function CategoryMaskButton({
  name,
  slug,
  maskUrl,
}: {
  name: string;
  slug: string;
  maskUrl?: string;
}) {
  return (
    <Link
      href={`/catalog?category=${slug}`}
      prefetch={true}
      className="group flex flex-col items-center gap-2"
    >
      <div
        className="flex h-24 w-24 items-center justify-center bg-gray-200 transition group-hover:bg-violet md:h-28 md:w-28"
        style={
          maskUrl
            ? {
                WebkitMaskImage: `url(${maskUrl})`,
                maskImage: `url(${maskUrl})`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }
            : { borderRadius: "9999px" }
        }
      />
      <span className="text-xs font-medium text-gray-600 group-hover:text-violet">{name}</span>
    </Link>
  );
}
