import { Clock, MessageSquare, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type MiniKpi = {
  id: string;
  label: string;
  value: string | number;
  tone?: "accent" | "ok" | "warn";
  icon: LucideIcon;
};

const toneBg = {
  accent: "var(--d-accent-soft)",
  ok: "var(--d-ok-soft)",
  warn: "var(--d-warn-soft)",
} as const;
const toneFg = {
  accent: "var(--d-accent-ink)",
  ok: "var(--d-ok)",
  warn: "var(--d-warn)",
} as const;

export function MiniKpiStrip({
  abertas,
  emFila,
  emAtendimento,
  tempoMedio,
}: {
  abertas: number;
  emFila: number;
  emAtendimento: number;
  tempoMedio: string;
}) {
  const kpis: MiniKpi[] = [
    { id: "open", label: "Abertas", value: abertas, tone: "accent", icon: MessageSquare },
    {
      id: "queue",
      label: "Em fila",
      value: emFila,
      tone: emFila > 0 ? "warn" : "ok",
      icon: Clock,
    },
    { id: "active", label: "Em atendimento", value: emAtendimento, tone: "accent", icon: Users },
    { id: "avg", label: "Tempo médio", value: tempoMedio, tone: "accent", icon: Zap },
  ];
  return (
    <div
      className="dashboard-v2"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 10,
      }}
    >
      {kpis.map((k) => {
        const Icon = k.icon;
        const tone = k.tone ?? "accent";
        return (
          <div
            key={k.id}
            style={{
              background: "var(--d-surface)",
              border: "1px solid var(--d-border)",
              borderRadius: "var(--d-radius)",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: toneBg[tone],
                color: toneFg[tone],
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
            </div>
            <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--d-text-2)",
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {k.label}
              </div>
              <div
                className="tnum"
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  lineHeight: 1.1,
                  color: "var(--d-text)",
                  whiteSpace: "nowrap",
                }}
              >
                {k.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
