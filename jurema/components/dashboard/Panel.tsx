import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  right,
  children,
  pad = 24,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  pad?: number;
}) {
  return (
    <div
      style={{
        background: "var(--d-surface)",
        border: "1px solid var(--d-border)",
        borderRadius: "var(--d-radius)",
        boxShadow: "var(--d-shadow-sm)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: `${pad - 4}px ${pad}px`,
          borderBottom: "1px solid var(--d-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--d-text)" }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 12, color: "var(--d-text-3)", marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        {right}
      </div>
      <div style={{ padding: pad }}>{children}</div>
    </div>
  );
}
