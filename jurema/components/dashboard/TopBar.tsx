import { Calendar, Search } from "lucide-react";

export function DashboardTopBar({ updatedLabel }: { updatedLabel: string }) {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "var(--d-surface)",
            border: "1px solid var(--d-border)",
            borderRadius: 8,
            color: "var(--d-text-3)",
            fontSize: 13,
          }}
        >
          <Search size={14} strokeWidth={1.8} />
          <span>Buscar conversas…</span>
          <span
            style={{
              padding: "1px 5px",
              border: "1px solid var(--d-border-strong)",
              borderRadius: 4,
              fontSize: 10,
              color: "var(--d-text-3)",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            ⌘K
          </span>
        </div>
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
