"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiBase } from "@/lib/api";
import { DEFAULT_SITE_CONFIG, type PricingConfig, type SiteConfig } from "@/lib/site-config";

export function AdminPricingPanel() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`${getApiBase()}/site/config`, { credentials: "include" });
    if (res.ok) setConfig(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updatePricing(key: keyof PricingConfig, value: number) {
    setConfig((c) => ({
      ...c,
      pricing: { ...c.pricing, [key]: value },
    }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${getApiBase()}/admin/site-config`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricing: config.pricing }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setSaved(true);
    } catch {
      setError("Не удалось сохранить настройки цен.");
    } finally {
      setSaving(false);
    }
  }

  const pricing = config.pricing ?? DEFAULT_SITE_CONFIG.pricing;

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">Общие наценки и скидки</h2>
      <p className="mt-1 text-sm text-[#717171]">
        Базовая цена берётся из Poizon. Наценка и скидка применяются ко всем товарам, если у товара нет
        индивидуальных значений.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-medium">Общая наценка, %</span>
          <input
            type="number"
            step="0.1"
            value={pricing.default_markup_percent}
            onChange={(e) => updatePricing("default_markup_percent", Number(e.target.value))}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Общая скидка, %</span>
          <input
            type="number"
            step="0.1"
            min={0}
            max={100}
            value={pricing.site_discount_percent}
            onChange={(e) => updatePricing("site_discount_percent", Number(e.target.value))}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-violet px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Сохранение…" : saved ? "Сохранено ✓" : "Сохранить"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
