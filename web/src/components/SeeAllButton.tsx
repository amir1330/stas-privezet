import Link from "next/link";

export function SeeAllButton({ href }: { href: string }) {
  return (
    <Link href={href} className="unicorn-see-all anim-see-all">
      Все
      <svg width="14" height="14" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="m8.25 5.5 5.5 5.5-5.5 5.5"
        />
      </svg>
    </Link>
  );
}
