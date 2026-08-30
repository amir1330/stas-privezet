"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import { Pill } from "@/components/Pill";

type Inquiry = {
  id: string;
  product_title: string | null;
  contact_name: string;
  contact_phone: string | null;
  status: string;
  notes: string | null;
};

export default function SupportDashboard() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await fetch(`${API}/inquiries?mine=${filter === "mine"}`, { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        setError("Sign in as support or admin to view this page.");
        return;
      }
      setInquiries(await res.json());
    } catch {
      setError("Could not load inquiries.");
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function claim(id: string) {
    await fetch(`${API}/inquiries/${id}/claim`, { method: "POST", credentials: "include" });
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`${API}/inquiries/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Support queue</h1>
      {error && <p className="mt-4 text-red-600">{error}</p>}

      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => setFilter("all")}>
          <Pill variant={filter === "all" ? "accent" : "default"}>All open</Pill>
        </button>
        <button type="button" onClick={() => setFilter("mine")}>
          <Pill variant={filter === "mine" ? "accent" : "default"}>Mine</Pill>
        </button>
      </div>

      <div className="mt-8 space-y-4">
        {inquiries.map((inq) => (
          <div key={inq.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{inq.product_title ?? "Product inquiry"}</p>
                <p className="text-sm text-gray-600">{inq.contact_name} · {inq.contact_phone}</p>
                <Pill className="mt-2">{inq.status}</Pill>
                {inq.notes && <p className="mt-2 text-sm text-gray-500">{inq.notes}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {inq.status === "new" && (
                  <button
                    type="button"
                    onClick={() => claim(inq.id)}
                    className="rounded-full bg-violet px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    Claim
                  </button>
                )}
                {inq.status !== "closed" && (
                  <>
                    <button
                      type="button"
                      onClick={() => updateStatus(inq.id, "in_progress")}
                      className="rounded-full border px-3 py-1 text-xs"
                    >
                      In progress
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(inq.id, "closed")}
                      className="rounded-full border px-3 py-1 text-xs"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {!error && inquiries.length === 0 && (
          <p className="text-gray-500">No inquiries in queue.</p>
        )}
      </div>
    </div>
  );
}
