"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export type EspecialistaOption = { user_id: string; nome: string | null };

export function CaixaFilters({
  isAdmin,
  especialistas,
}: {
  isAdmin: boolean;
  especialistas: EspecialistaOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [qDraft, setQDraft] = useState(sp.get("q") ?? "");

  // Sincroniza input local quando URL muda externamente.
  useEffect(() => {
    setQDraft(sp.get("q") ?? "");
  }, [sp]);

  // Debounce 350ms na busca.
  useEffect(() => {
    const current = sp.get("q") ?? "";
    if (qDraft === current) return;
    const t = setTimeout(() => update({ q: qDraft || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDraft]);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const q = next.toString();
    const url = q ? `${pathname}?${q}` : pathname;
    start(() => router.replace(url as never));
  }

  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const especialistaId = sp.get("especialista") ?? "";
  const q = sp.get("q") ?? "";
  const hasAny = from || to || especialistaId || q;

  return (
    <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg border border-whatsapp-border bg-whatsapp-panel">
      <label className="flex flex-col gap-1 text-xs text-whatsapp-muted flex-1 min-w-[200px]">
        <span>Buscar (nome ou conteúdo da mensagem)</span>
        <input
          type="search"
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
          placeholder="ex: João, dor de cabeça…"
          className="px-2 py-1.5 rounded bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text text-sm focus:outline-none focus:border-whatsapp-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-whatsapp-muted">
        <span>De</span>
        <input
          type="date"
          value={from}
          onChange={(e) => update({ from: e.target.value })}
          className="px-2 py-1.5 rounded bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text text-sm focus:outline-none focus:border-whatsapp-accent"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-whatsapp-muted">
        <span>Até</span>
        <input
          type="date"
          value={to}
          onChange={(e) => update({ to: e.target.value })}
          className="px-2 py-1.5 rounded bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text text-sm focus:outline-none focus:border-whatsapp-accent"
        />
      </label>
      {isAdmin && (
        <label className="flex flex-col gap-1 text-xs text-whatsapp-muted">
          <span>Especialista</span>
          <select
            value={especialistaId}
            onChange={(e) => update({ especialista: e.target.value })}
            className="px-2 py-1.5 rounded bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text text-sm focus:outline-none focus:border-whatsapp-accent"
          >
            <option value="">Todos</option>
            {especialistas.map((e) => (
              <option key={e.user_id} value={e.user_id}>
                {e.nome ?? e.user_id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
      )}
      {hasAny && (
        <button
          type="button"
          onClick={() => {
            setQDraft("");
            update({ from: null, to: null, especialista: null, q: null });
          }}
          className="text-xs text-whatsapp-muted hover:text-whatsapp-text underline underline-offset-2"
        >
          Limpar
        </button>
      )}
      {pending && <span className="text-xs text-whatsapp-muted ml-auto">Atualizando…</span>}
    </div>
  );
}
