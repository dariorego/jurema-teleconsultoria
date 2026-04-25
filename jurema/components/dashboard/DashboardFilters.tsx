"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export type CategoriaOption = { codigo: string; rotulo: string };

const PERIODS = [
  { id: "7", label: "7 dias" },
  { id: "30", label: "30 dias" },
  { id: "90", label: "90 dias" },
] as const;

export function DashboardFilters({ categorias }: { categorias: CategoriaOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const period = sp.get("period") ?? "7";
  const selected = new Set((sp.get("cats") ?? "").split(",").filter(Boolean));

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const q = next.toString();
    start(() => router.replace((q ? `${pathname}?${q}` : pathname) as never));
  }

  function toggleCat(codigo: string) {
    const next = new Set(selected);
    if (next.has(codigo)) next.delete(codigo);
    else next.add(codigo);
    update({ cats: next.size ? Array.from(next).join(",") : null });
  }

  return (
    <div
      className="dashboard-v2"
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
        background: "var(--d-surface)",
        border: "1px solid var(--d-border)",
        borderRadius: "var(--d-radius)",
        padding: "10px 14px",
        marginBottom: 14,
        fontSize: 13,
        color: "var(--d-text-2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "var(--d-text-3)" }}>Período</span>
        <div style={{ display: "inline-flex", borderRadius: 6, overflow: "hidden", border: "1px solid var(--d-border)" }}>
          {PERIODS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => update({ period: p.id === "7" ? null : p.id })}
              style={{
                padding: "5px 10px",
                fontSize: 12,
                fontWeight: 500,
                background:
                  period === p.id ? "var(--d-accent-soft)" : "var(--d-surface)",
                color: period === p.id ? "var(--d-accent-ink)" : "var(--d-text-2)",
                border: "none",
                borderLeft: i === 0 ? "none" : "1px solid var(--d-border)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {categorias.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ color: "var(--d-text-3)" }}>Categorias</span>
          {categorias.map((c) => {
            const on = selected.size === 0 || selected.has(c.codigo);
            const explicit = selected.has(c.codigo);
            return (
              <button
                key={c.codigo}
                type="button"
                onClick={() => toggleCat(c.codigo)}
                style={{
                  padding: "4px 9px",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 999,
                  background: explicit ? "var(--d-accent-soft)" : "var(--d-surface)",
                  color: explicit ? "var(--d-accent-ink)" : on ? "var(--d-text-2)" : "var(--d-text-3)",
                  border: `1px solid ${
                    explicit ? "var(--d-accent)" : "var(--d-border)"
                  }`,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textTransform: "capitalize",
                }}
                title={
                  selected.size === 0
                    ? "Clique para mostrar APENAS esta categoria"
                    : explicit
                      ? "Selecionada — clique para remover"
                      : "Clique para incluir"
                }
              >
                {c.rotulo}
              </button>
            );
          })}
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => update({ cats: null })}
              style={{
                padding: "4px 9px",
                fontSize: 12,
                background: "transparent",
                color: "var(--d-text-3)",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 2,
                fontFamily: "inherit",
              }}
            >
              Todas
            </button>
          )}
        </div>
      )}

      {pending && (
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--d-text-3)" }}>
          Atualizando…
        </span>
      )}
    </div>
  );
}
