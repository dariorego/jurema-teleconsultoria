import Link from "next/link";
import { Paginacao } from "./Paginacao";

export type AtendimentoRow = {
  id: string;
  especialidade: string;
  /** Timestamp ISO usado para calcular "tempo há". */
  refTimestamp: string;
  paciente: {
    primeiro_nome: string;
    ultimo_nome: string | null;
    wa_id: string;
  } | null;
};

function formatTempo(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 60_000) return "agora";
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  if (h < 24) return r ? `${h}h ${r}min` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

const TONE = {
  warn: { fg: "var(--d-warn)" },
  accent: { fg: "var(--d-accent-ink)" },
  muted: { fg: "var(--d-text-3)" },
} as const;

export function AtendimentosTable({
  title,
  subtitle,
  rows,
  total,
  page,
  perPage,
  paramPrefix,
  tempoLabel,
  tempoTone = "warn",
  basePath = "",
  showLink = true,
}: {
  title: string;
  subtitle?: string;
  rows: AtendimentoRow[];
  total: number;
  page: number;
  perPage: number;
  paramPrefix: string;
  tempoLabel: string;
  tempoTone?: keyof typeof TONE;
  basePath?: string;
  showLink?: boolean;
}) {
  const now = Date.now();
  const tone = TONE[tempoTone];

  return (
    <div
      style={{
        background: "var(--d-surface)",
        border: "1px solid var(--d-border)",
        borderRadius: "var(--d-radius)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--d-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--d-text)" }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--d-text-3)", marginTop: 2 }}>
            {subtitle ?? (total === 0 ? "Nenhuma conversa" : `${total} conversa(s)`)}
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  color: "var(--d-text-3)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                <th style={{ textAlign: "left", padding: "10px 24px", fontWeight: 600 }}>Nome</th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600 }}>
                  Telefone
                </th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600 }}>
                  Categoria
                </th>
                <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600 }}>
                  {tempoLabel}
                </th>
                {showLink && <th style={{ padding: "10px 24px" }} aria-label="Ações" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const nome = r.paciente
                  ? `${r.paciente.primeiro_nome} ${r.paciente.ultimo_nome ?? ""}`.trim()
                  : "—";
                const tempo = formatTempo(now - new Date(r.refTimestamp).getTime());
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--d-border)" }}>
                    <td
                      style={{
                        padding: "10px 24px",
                        color: "var(--d-text)",
                        fontWeight: 500,
                      }}
                    >
                      {nome}
                    </td>
                    <td style={{ padding: "10px 16px", color: "var(--d-text-2)" }}>
                      {r.paciente?.wa_id ?? "—"}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        color: "var(--d-text-2)",
                        textTransform: "capitalize",
                      }}
                    >
                      {r.especialidade}
                    </td>
                    <td
                      className="tnum"
                      style={{
                        padding: "10px 16px",
                        color: tone.fg,
                        fontWeight: 600,
                        textAlign: "right",
                      }}
                    >
                      {tempo}
                    </td>
                    {showLink && (
                      <td style={{ padding: "10px 24px", textAlign: "right" }}>
                        <Link
                          href={`${basePath}/chat/${r.id}` as never}
                          style={{
                            display: "inline-block",
                            padding: "5px 12px",
                            fontSize: 12,
                            fontWeight: 500,
                            borderRadius: 6,
                            background: "var(--d-accent)",
                            color: "#fff",
                            textDecoration: "none",
                          }}
                        >
                          Abrir
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Paginacao paramPrefix={paramPrefix} page={page} perPage={perPage} total={total} />
    </div>
  );
}
