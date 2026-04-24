export type HourBucket = { h: string; v: number };

export function HoursChart({ data }: { data: HourBucket[] }) {
  const max = Math.max(...data.map((d) => d.v), 1);
  const hasAny = data.some((d) => d.v > 0);
  return (
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
      {data.map((d) => {
        const h = (d.v / max) * 100;
        const isPeak = hasAny && d.v === max;
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
              {d.v || ""}
            </div>
            <div
              style={{ width: "100%", flex: 1, display: "flex", alignItems: "flex-end" }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${h}%`,
                  background: isPeak ? "var(--d-accent)" : "var(--d-accent-soft)",
                  border: isPeak ? "none" : "1px solid var(--d-accent)",
                  borderBottom: "none",
                  borderRadius: "4px 4px 0 0",
                  transition: "height .6s cubic-bezier(.2,.8,.2,1)",
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: "var(--d-text-3)", fontWeight: 500 }}>
              {d.h}
            </div>
          </div>
        );
      })}
    </div>
  );
}
