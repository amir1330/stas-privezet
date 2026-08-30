"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiBase } from "@/lib/api";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`${getApiBase()}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setError("Неверный email или пароль");
      return;
    }
    const data = await res.json();
    const role = data.user?.role;
    if (role === "admin") {
      router.push(next.startsWith("/admin") ? next : "/");
      router.refresh();
      return;
    }
    router.push("/catalog");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-2xl font-bold">Вход</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full rounded-xl border px-4 py-3 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          required
          className="w-full rounded-xl border px-4 py-3 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full rounded-full bg-violet py-3 text-sm font-semibold text-white">
          Войти
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-[#717171]">Загрузка…</div>}>
      <LoginForm />
    </Suspense>
  );
}
