import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import { Sparkline } from "./Sparkline";

export type KpiTone = "accent" | "ok" | "warn" | "danger";

export type Kpi = {
  id: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: KpiTone;
  delta?: number;
  deltaLabel?: string;
  deltaUnit?: "pct" | "abs";
  /** Lower-is-better metric: queue count, average time. */
  lowerIsBetter?: boolean;
  spark?: number[];
};

const toneBg: Record<KpiTone, string> = {
  accent: "var(--d-accent-soft)",
  ok: "var(--d-ok-soft)",
  warn: "var(--d-warn-soft)",
  danger: "var(--d-danger-soft)",
};
const toneFg: Record<KpiTone, string> = {
  accent: "var(--d-accent-ink)",
  ok: "var(--d-ok)",
  warn: "var(--d-warn)",
  danger: "var(--d-danger)",
};

export function KpiCard({ k }: { k: Kpi }) {
  const tone = k.tone ?? "accent";
  const Icon = k.icon;

  const delta = (() => {
    if (k.delta === undefined) return null;
    const zero = k.delta === 0;
    const pos = k.delta > 0;
    const good = zero ? false : k.lowerIsBetter ? !pos : pos;
    const bad = zero ? false : k.lowerIsBetter ? pos : !pos;
    const color = zero
      ? "var(--d-text-3)"
      : good
        ? "var(--d-ok)"
        : bad
          ? "var(--d-danger)"
          : "var(--d-text-3)";
    const Arrow = zero ? Minus : pos ? ArrowUp : ArrowDown;
    const num =
      k.deltaUnit === "pct"
        ? `${Math.abs(k.delta)}%`
        : k.delta > 0
          ? `+${k.delta}`
          : `${k.delta}`;
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          color,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <Arrow size={12} strokeWidth={2.4} />
        <span className="tnum">{num}</span>
        {k.deltaLabel && (
          <span style={{ color: "var(--d-text-3)", fontWeight: 500, marginLeft: 4 }}>
            {k.deltaLabel}
          </span>
        )}
      </div>
    );
  })();

  return (
    <div
      style={{
        background: "var(--d-surface)",
        border: "1px solid var(--d-border)",
        borderRadius: "var(--d-radius)",
        padding: "18px 20px",
        boxShadow: "var(--d-shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 132,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: toneBg[tone],
            color: toneFg[tone],
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon size={16} strokeWidth={1.8} />
        </div>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--d-text-2)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {k.label}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            className="tnum"
            style={{
              fontSize: 30,
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--d-text)",
              whiteSpace: "nowrap",
            }}
          >
            {k.value}
          </div>
          {delta}
        </div>
        {k.spark && (
          <div className="kpi-spark" style={{ flexShrink: 0 }}>
            <Sparkline data={k.spark} tone={tone} />
          </div>
        )}
      </div>
    </div>
  );
}
