export type HourBucket = {
  h: string;
  /** conversas criadas nessa hora cujo status atual é fila */
  aberto: number;
  /** ... cujo status atual é em_atendimento ou aguardando_avaliacao */
  emAtendimento: number;
  /** ... cujo status atual é encerrada */
  fechado: number;
};

const COLOR_OPEN = "var(--d-warn)";
const COLOR_ACTIVE = "var(--d-accent)";
const COLOR_CLOSED = "var(--d-text-3)";

export function HoursChart({ data }: { data: HourBucket[] }) {
  const totals = data.map((d) => d.aberto + d.emAtendimento + d.fechado);
  const max = Math.max(...totals, 1);
  const peakIdx = totals.findIndex((t) => t === max);
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
          gap: 4,
          alignItems: "end",
          height: 160,
          padding: "8px 0",
          minWidth: 0,
        }}
      >
        {data.map((d, i) => {
          const total = d.aberto + d.emAtendimento + d.fechado;
          const isPeak = max > 0 && i === peakIdx;
          const heightPct = (total / max) * 100;
          const segOpen = total ? (d.aberto / total) * 100 : 0;
          const segActive = total ? (d.emAtendimento / total) * 100 : 0;
          const segClosed = total ? (d.fechado / total) * 100 : 0;
          return (
            <div
              key={d.h}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                height: "100%",
                minWidth: 0,
              }}
            >
              <div
                className="tnum"
                style={{
                  fontSize: 11,
                  color: isPeak ? "var(--d-accent-ink)" : "var(--d-text-3)",
                  fontWeight: 600,
                  minHeight: 14,
                }}
              >
                {total || ""}
              </div>
              <div
                style={{
                  width: "100%",
                  flex: 1,
                  display: "flex",
                  alignItems: "flex-end",
                }}
                title={`Aberto: ${d.aberto} · Em atendimento: ${d.emAtendimento} · Fechado: ${d.fechado}`}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${heightPct}%`,
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "4px 4px 0 0",
                    overflow: "hidden",
                    border: "1px solid var(--d-border)",
                    transition: "height .6s cubic-bezier(.2,.8,.2,1)",
                  }}
                >
                  <div style={{ height: `${segOpen}%`, background: COLOR_OPEN }} />
                  <div style={{ height: `${segActive}%`, background: COLOR_ACTIVE }} />
                  <div style={{ height: `${segClosed}%`, background: COLOR_CLOSED, opacity: 0.45 }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--d-text-3)", fontWeight: 500 }}>
                {d.h}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          gap: 14,
          marginTop: 8,
          fontSize: 11,
          color: "var(--d-text-3)",
          flexWrap: "wrap",
        }}
      >
        <Legend color={COLOR_OPEN} label="Em fila" />
        <Legend color={COLOR_ACTIVE} label="Em atendimento" />
        <Legend color={COLOR_CLOSED} label="Encerrada" muted />
      </div>
    </div>
  );
}

function Legend({ color, label, muted }: { color: string; label: string; muted?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          background: color,
          opacity: muted ? 0.45 : 1,
        }}
      />
      {label}
    </span>
  );
}
