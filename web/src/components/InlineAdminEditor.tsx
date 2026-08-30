"use client";

import { useAuth } from "@/lib/auth";
import { useAdminEdit } from "@/lib/admin-edit";
import { AdminPageBuilder } from "@/components/AdminPageBuilder";

export function InlineAdminEditor() {
  const { isAdmin, loading } = useAuth();
  const { editing, setEditing, toggleEditing } = useAdminEdit();

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleEditing}
        aria-label={editing ? "Закрыть редактор" : "Редактировать сайт"}
        className="fixed bottom-6 right-6 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
      >
        {editing ? (
          <span className="text-xl">✕</span>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0 0-3L16.5 4.5a2.1 2.1 0 0 0-3 0L3 15v4Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.75" />
          </svg>
        )}
      </button>

      {editing && (
        <>
          <button
            type="button"
            aria-label="Закрыть панель"
            className="fixed inset-0 z-[65] bg-black/30"
            onClick={() => setEditing(false)}
          />
          <aside className="fixed bottom-0 right-0 top-0 z-[68] flex w-[min(420px,92vw)] flex-col border-l border-black/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-bold text-black">Редактор главной</p>
                <p className="text-xs text-[#717171]">Изменения видны на странице после сохранения</p>
              </div>
              <button type="button" onClick={() => setEditing(false)} className="rounded-full p-2 hover:bg-black/5">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AdminPageBuilder inline onSaved={() => window.location.reload()} />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
