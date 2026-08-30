"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiBase } from "@/lib/api";
import {
  DEFAULT_SITE_CONFIG,
  SECTION_LABELS,
  type HomepageSection,
  type PromoTile,
  type SiteConfig,
  type ThemeConfig,
} from "@/lib/site-config";
import { Pill } from "@/components/Pill";

export function AdminPageBuilder({
  inline = false,
  onSaved,
}: {
  inline?: boolean;
  onSaved?: () => void;
}) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`${getApiBase()}/site/config`, { credentials: "include" });
    if (res.ok) setConfig(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateTheme(key: keyof ThemeConfig, value: string) {
    setConfig((c) => ({ ...c, theme: { ...c.theme, [key]: value } }));
    setSaved(false);
  }

  function toggleSection(id: string) {
    setConfig((c) => ({
      ...c,
      sections: c.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }));
    setSaved(false);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    setConfig((c) => {
      const sections = [...c.sections].sort((a, b) => a.order - b.order);
      const [moved] = sections.splice(from, 1);
      sections.splice(to, 0, moved);
      return {
        ...c,
        sections: sections.map((s, i) => ({ ...s, order: i })),
      };
    });
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
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setConfig(await res.json());
      setSaved(true);
      onSaved?.();
    } catch {
      setError("Не удалось сохранить. Войдите как admin.");
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    const res = await fetch(`${getApiBase()}/admin/site-config/reset`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) setConfig(await res.json());
  }

  const sorted = [...config.sections].sort((a, b) => a.order - b.order);

  return (
    <div className={inline ? "space-y-6" : "mt-6 grid gap-6 lg:grid-cols-2"}>
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Цвета</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {(Object.keys(config.theme) as (keyof ThemeConfig)[]).map((key) => (
              <label key={key} className="text-sm">
                <span className="text-gray-500">{key}</span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={config.theme[key]}
                    onChange={(e) => updateTheme(key, e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border"
                  />
                  <input
                    type="text"
                    value={config.theme[key]}
                    onChange={(e) => updateTheme(key, e.target.value)}
                    className="flex-1 rounded-lg border px-2 py-1 text-xs font-mono"
                  />
                </div>
              </label>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.remove_bg_default}
              onChange={(e) => {
                setConfig((c) => ({ ...c, remove_bg_default: e.target.checked }));
                setSaved(false);
              }}
            />
            Удалять фон при загрузке (по умолчанию)
          </label>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Картинки категорий</h2>
          <p className="mt-1 text-xs text-gray-500">URL картинки для конкретной плитки</p>
          <div className="mt-4 space-y-3">
            {[
              { id: "bags", label: "Сумки и рюкзаки" },
              { id: "sneakers", label: "Кроссовки и кеды" },
              { id: "outerwear", label: "Верхняя одежда" },
              { id: "watches", label: "Часы" },
            ].map(({ id, label }) => {
              const existing = config.tile_overrides.find((t) => t.id === id);
              return (
                <div key={id} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-2">
                  <span className="text-sm font-medium">{label}</span>
                  <input
                    type="url"
                    placeholder="https://…"
                    value={existing?.image_url ?? ""}
                    onChange={(e) => {
                      const val = e.target.value || null;
                      setConfig((c) => {
                        const rest = c.tile_overrides.filter((t) => t.id !== id);
                        if (!val) return { ...c, tile_overrides: rest };
                        return {
                          ...c,
                          tile_overrides: [
                            ...rest,
                            { id, label, image_url: val, category_slug: existing?.category_slug ?? null },
                          ],
                        };
                      });
                      setSaved(false);
                    }}
                    className="rounded-lg border px-2 py-1 text-xs"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Промо-плитки</h2>
          <p className="mt-1 text-xs text-gray-500">Garage Sale, скидки и баннеры в горизонтальной ленте</p>
          <div className="mt-4 space-y-3">
            {(config.promo_tiles ?? []).map((tile: PromoTile) => (
              <div key={tile.id} className="grid gap-2 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{tile.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig((c) => ({
                        ...c,
                        promo_tiles: (c.promo_tiles ?? []).map((p) =>
                          p.id === tile.id ? { ...p, enabled: !p.enabled } : p,
                        ),
                      }));
                      setSaved(false);
                    }}
                  >
                    <Pill variant={tile.enabled ? "accent" : "default"}>
                      {tile.enabled ? "Вкл" : "Выкл"}
                    </Pill>
                  </button>
                </div>
                <input
                  type="text"
                  value={tile.sublabel ?? ""}
                  placeholder="Подпись"
                  onChange={(e) => {
                    setConfig((c) => ({
                      ...c,
                      promo_tiles: (c.promo_tiles ?? []).map((p) =>
                        p.id === tile.id ? { ...p, sublabel: e.target.value || null } : p,
                      ),
                    }));
                    setSaved(false);
                  }}
                  className="rounded-lg border px-2 py-1 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="color"
                    value={tile.color}
                    onChange={(e) => {
                      setConfig((c) => ({
                        ...c,
                        promo_tiles: (c.promo_tiles ?? []).map((p) =>
                          p.id === tile.id ? { ...p, color: e.target.value } : p,
                        ),
                      }));
                      setSaved(false);
                    }}
                    className="h-9 w-full cursor-pointer rounded border"
                  />
                  <input
                    type="text"
                    value={tile.href}
                    placeholder="/catalog"
                    onChange={(e) => {
                      setConfig((c) => ({
                        ...c,
                        promo_tiles: (c.promo_tiles ?? []).map((p) =>
                          p.id === tile.id ? { ...p, href: e.target.value } : p,
                        ),
                      }));
                      setSaved(false);
                    }}
                    className="rounded-lg border px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {!inline && (
          <div className="rounded-2xl border border-violet/20 bg-violet/5 p-5">
            <h2 className="text-lg font-bold">Как пользоваться</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>На сайте нажмите кнопку карандаша — редактор откроется поверх магазина.</li>
              <li>Товары и цены — вкладка «Цены» в /admin (только для admin).</li>
            </ul>
          </div>
        )}

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Секции главной</h2>
            <span className="text-xs text-gray-400">Перетащите для сортировки</span>
          </div>
          <ul className="mt-4 space-y-2">
            {sorted.map((section: HomepageSection, idx) => (
              <li
                key={section.id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx !== null) reorder(dragIdx, idx);
                  setDragIdx(null);
                }}
                className={`flex cursor-grab items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                  section.enabled ? "bg-white" : "bg-gray-50 opacity-60"
                } ${dragIdx === idx ? "ring-2 ring-violet" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">⠿</span>
                  <span className="text-sm font-medium">
                    {SECTION_LABELS[section.type] ?? section.type}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="text-xs"
                >
                  <Pill variant={section.enabled ? "accent" : "default"}>
                    {section.enabled ? "Вкл" : "Выкл"}
                  </Pill>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-full bg-violet px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Сохранение…" : saved ? "Сохранено ✓" : "Сохранить"}
          </button>
          <button type="button" onClick={reset} className="rounded-full border px-4 py-2 text-sm">
            Сбросить
          </button>
          {!inline && (
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Открыть превью ↗
            </a>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {!inline && (
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="mb-2 px-2 text-sm font-medium text-gray-500">Превью главной</p>
          <iframe
            title="Homepage preview"
            src="/"
            className="h-[70vh] w-full rounded-xl border bg-white"
          />
        </div>
      )}
    </div>
  );
}
