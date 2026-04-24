export type CategoryRow = {
  label: string;
  total: number;
  acute?: number;
  followup?: number;
};

export function CategoryChart({
  data,
  style = "grouped",
}: {
  data: CategoryRow[];
  style?: "grouped" | "solid";
}) {
  if (data.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "var(--d-text-3)", fontStyle: "italic" }}>
        Nenhuma solicitação ainda.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {data.map((row) => {
        const pctTotal = (row.total / max) * 100;
        const pctAcute = ((row.acute ?? 0) / max) * 100;
        const pctFollow = ((row.followup ?? 0) / max) * 100;
        return (
          <div
            key={row.label}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(90px, 120px) 1fr 36px",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "var(--d-text-2)",
                fontWeight: 500,
                textTransform: "capitalize",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {row.label}
            </div>
            <div
              style={{
                position: "relative",
                height: 26,
                background: "var(--d-surface-2)",
                borderRadius: 6,
                overflow: "hidden",
                border: "1px solid var(--d-border)",
              }}
            >
              {style === "grouped" && (row.acute !== undefined || row.followup !== undefined) ? (
                <>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${pctAcute}%`,
                      background: "var(--d-accent)",
                      transition: "width .6s cubic-bezier(.2,.8,.2,1)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: `${pctAcute}%`,
                      top: 0,
                      bottom: 0,
                      width: `${pctFollow}%`,
                      background: "var(--d-accent)",
                      opacity: 0.45,
                      transition:
                        "width .6s cubic-bezier(.2,.8,.2,1), left .6s cubic-bezier(.2,.8,.2,1)",
                    }}
                  />
                </>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pctTotal}%`,
                    background: "var(--d-accent)",
                    transition: "width .6s cubic-bezier(.2,.8,.2,1)",
                  }}
                />
              )}
            </div>
            <div
              className="tnum"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--d-text)",
                textAlign: "right",
              }}
            >
              {row.total}
            </div>
          </div>
        );
      })}
    </div>
  );
}
