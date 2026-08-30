"use client";

import { useState } from "react";
import { API } from "@/lib/api";

interface Variant {
  id: string;
  size: string | null;
  price_krw: number | null;
  in_stock: boolean;
}

export function BuyBar({
  productId,
  title,
  variants,
  priceKrw,
}: {
  productId: string;
  title: string;
  variants: Variant[];
  priceKrw: number | null;
}) {
  const inStock = variants.filter((v) => v.in_stock);
  const [selected, setSelected] = useState<string | null>(inStock[0]?.size ?? null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitInquiry() {
    setLoading(true);
    try {
      await fetch(`${API}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_id: productId,
          contact_name: "Guest",
          contact_channel: selected ? `Size ${selected}` : undefined,
        }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/8 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-500">{title}</p>
          {priceKrw != null && (
            <p className="text-xl font-bold">₩{Math.round(priceKrw).toLocaleString()}</p>
          )}
        </div>

        {inStock.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {inStock.slice(0, 10).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelected(v.size)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  selected === v.size
                    ? "border-violet bg-violet text-white"
                    : "border-black/10 hover:border-violet"
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={loading || submitted}
          onClick={submitInquiry}
          className="shrink-0 rounded-full bg-violet px-8 py-3.5 text-sm font-bold text-white transition hover:bg-violet-dark disabled:opacity-60"
        >
          {submitted ? "Заявка отправлена" : loading ? "…" : "Купить"}
        </button>
      </div>
    </div>
  );
}
