import { useId } from "react";

type Tone = "accent" | "ok" | "warn" | "danger";

const toneVar: Record<Tone, string> = {
  accent: "var(--d-accent)",
  ok: "var(--d-ok)",
  warn: "var(--d-warn)",
  danger: "var(--d-danger)",
};

export function Sparkline({
  data,
  tone = "accent",
  height = 28,
  width = 96,
}: {
  data: number[];
  tone?: Tone;
  height?: number;
  width?: number;
}) {
  const id = useId().replace(/:/g, "_");
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const stepX = width / (data.length - 1);
  const points = data.map<[number, number]>((v, i) => [
    i * stepX,
    height - ((v - min) / range) * (height - 4) - 2,
  ]);
  const d = points
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(" ");
  const area = `${d} L${width},${height} L0,${height} Z`;
  const last = points[points.length - 1];
  const c = toneVar[tone];
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.22" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} stroke={c} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill={c} />
    </svg>
  );
}
