"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBase } from "@/lib/api";
import { AdminPricingPanel } from "@/components/AdminPricingPanel";
import { Pill } from "@/components/Pill";

type Product = {
  id: string;
  spu_id: number;
  title: string;
  brand: string | null;
  price_krw: number | null;
  price_original_krw: number | null;
  price_manual_krw: number | null;
  markup_percent: number | null;
  discount_percent: number | null;
  is_published: boolean;
  is_in_stock: boolean | null;
};

type Stats = { products_total: number; products_published: number; users: number };

type AuditEntry = {
  id: string;
  action: string;
  entity: string;
  created_at: string;
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<"products" | "pricing" | "audit">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Product | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function load() {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`${getApiBase()}/admin/products?limit=100`, { credentials: "include" }),
        fetch(`${getApiBase()}/admin/stats`, { credentials: "include" }),
      ]);
      if (!pRes.ok) {
        setError("Нет доступа.");
        return;
      }
      setProducts(await pRes.json());
      setStats(await sRes.json());
    } catch {
      setError("Не удалось загрузить данные.");
    }
  }

  async function loadAudit() {
    const res = await fetch(`${getApiBase()}/admin/audit-log`, { credentials: "include" });
    if (res.ok) setAudit(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (tab === "audit") loadAudit();
  }, [tab]);

  async function togglePublish(id: string, published: boolean) {
    await fetch(`${getApiBase()}/admin/products/${id}/publish?published=${published}`, {
      method: "PATCH",
      credentials: "include",
    });
    load();
  }

  async function bulkPublish(published: boolean) {
    await fetch(`${getApiBase()}/admin/products/bulk-publish`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_ids: [...selected], published }),
    });
    setSelected(new Set());
    load();
  }

  async function saveProduct() {
    if (!editing) return;
    const res = await fetch(`${getApiBase()}/admin/products/${editing.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price_manual_krw: editing.price_manual_krw,
        markup_percent: editing.markup_percent,
        discount_percent: editing.discount_percent,
      }),
    });
    if (res.ok) {
      setEditing(null);
      load();
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Управление магазином</h1>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          ← К магазину
        </button>
      </div>
      <p className="mt-2 text-sm text-[#717171]">
        Редактор главной — кнопка карандаша на сайте. Здесь — товары, цены и аудит.
      </p>
      {error && <p className="mt-4 text-red-600">{error}</p>}

      {stats && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            ["Товаров", stats.products_total],
            ["На витрине", stats.products_published],
            ["Пользователей", stats.users],
          ].map(([label, val]) => (
            <div key={label as string} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold">{val}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex gap-2">
        {(["products", "pricing", "audit"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}>
            <Pill variant={tab === t ? "accent" : "default"}>
              {t === "products" ? "Товары" : t === "pricing" ? "Цены" : "Аудит"}
            </Pill>
          </button>
        ))}
      </div>

      {tab === "pricing" && <AdminPricingPanel />}

      {tab === "products" && (
        <>
          {selected.size > 0 && (
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => bulkPublish(true)} className="rounded-full bg-violet px-4 py-1 text-xs text-white">
                Опубликовать {selected.size}
              </button>
              <button type="button" onClick={() => bulkPublish(false)} className="rounded-full border px-4 py-1 text-xs">
                Снять {selected.size}
              </button>
            </div>
          )}
          <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="p-3"></th>
                  <th className="p-3">Название</th>
                  <th className="p-3">Бренд</th>
                  <th className="p-3">Цена</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                    </td>
                    <td className="max-w-xs truncate p-3">{p.title}</td>
                    <td className="p-3">{p.brand}</td>
                    <td className="p-3">
                      {p.price_krw ? `₩${Math.round(p.price_krw).toLocaleString()}` : "—"}
                      {p.price_original_krw && (
                        <span className="ml-1 text-xs text-[#717171] line-through">
                          ₩{Math.round(p.price_original_krw).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <Pill variant={p.is_published ? "sale" : "default"}>
                        {p.is_published ? "Live" : "Draft"}
                      </Pill>
                    </td>
                    <td className="p-3 space-x-2">
                      <button type="button" onClick={() => setEditing(p)} className="text-violet text-xs hover:underline">
                        Цена
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePublish(p.id, !p.is_published)}
                        className="text-violet text-xs hover:underline"
                      >
                        {p.is_published ? "Снять" : "Опубликовать"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "audit" && (
        <div className="mt-6 space-y-2">
          {audit.map((a) => (
            <div key={a.id} className="rounded-xl bg-white p-3 text-sm shadow-sm">
              <span className="font-medium">{a.action}</span> — {a.entity}
              <span className="ml-2 text-gray-400">{a.created_at}</span>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="font-bold">Цена товара</h3>
            <p className="mt-1 line-clamp-2 text-sm text-[#717171]">{editing.title}</p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                Фиксированная цена, ₩
                <input
                  type="number"
                  value={editing.price_manual_krw ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      price_manual_krw: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="Оставьте пустым для авто"
                />
              </label>
              <label className="block text-sm">
                Наценка, % (индив.)
                <input
                  type="number"
                  value={editing.markup_percent ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      markup_percent: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                Скидка, % (индив.)
                <input
                  type="number"
                  value={editing.discount_percent ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      discount_percent: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={saveProduct} className="rounded-full bg-violet px-5 py-2 text-sm text-white">
                Сохранить
              </button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border px-5 py-2 text-sm">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
