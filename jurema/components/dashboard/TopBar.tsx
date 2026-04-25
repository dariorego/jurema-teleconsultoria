"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Search } from "lucide-react";
import { BASE_PATH } from "@/lib/basePath";

export function DashboardTopBar({ updatedLabel }: { updatedLabel: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const value = q.trim();
    const url = value
      ? `${BASE_PATH}/caixa?q=${encodeURIComponent(value)}`
      : `${BASE_PATH}/caixa`;
    router.push(url as never);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "var(--d-text)",
            letterSpacing: "-0.01em",
          }}
        >
          Dashboard
        </div>
        <div style={{ fontSize: 13, color: "var(--d-text-3)", marginTop: 2 }}>
          Resumo do atendimento · {updatedLabel}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <form
          onSubmit={buscar}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "var(--d-surface)",
            border: "1px solid var(--d-border)",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          <Search size={14} strokeWidth={1.8} style={{ color: "var(--d-text-3)" }} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar conversas…"
            aria-label="Buscar conversas por nome ou conteúdo"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--d-text)",
              fontSize: 13,
              fontFamily: "inherit",
              minWidth: 180,
            }}
          />
        </form>
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "var(--d-surface)",
            border: "1px solid var(--d-border)",
            borderRadius: 8,
            color: "var(--d-text-2)",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Calendar size={14} strokeWidth={1.8} />
          <span>Hoje</span>
        </button>
      </div>
    </div>
  );
}
