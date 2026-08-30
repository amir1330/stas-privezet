"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form onSubmit={submit} className="relative w-full">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Найти кроссовки, бренд…"
        className="h-12 w-full rounded-full bg-[#f6f6f6] py-2.5 pl-5 pr-24 text-sm outline-none"
      />
      <button
        type="submit"
        className="absolute right-1 top-1 rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white"
      >
        Найти
      </button>
    </form>
  );
}
