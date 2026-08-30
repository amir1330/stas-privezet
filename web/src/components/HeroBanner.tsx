import Link from "next/link";

export function HeroBanner({
  title,
  subtitle,
  imageUrl,
  href = "/catalog",
}: {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-surface-muted to-white">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
        <div className="relative z-10">
          <p
            className="pointer-events-none absolute -left-2 -top-8 select-none text-[5rem] font-black uppercase leading-none text-violet/10 md:text-[7rem]"
            aria-hidden
          >
            {title.split(" ")[0]}
          </p>
          <h1 className="relative text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
          {subtitle && <p className="mt-4 max-w-md text-lg text-gray-600">{subtitle}</p>}
          <Link
            href={href}
            className="mt-8 inline-flex rounded-full bg-violet px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet/90"
          >
            Shop now
          </Link>
        </div>
        {imageUrl && (
          <div className="relative flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              width={600}
              height={500}
              className="max-h-[420px] w-auto object-contain drop-shadow-xl"
              fetchPriority="high"
            />
          </div>
        )}
      </div>
    </section>
  );
}
