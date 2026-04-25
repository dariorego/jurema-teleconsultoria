import Link from "next/link";

export type FilaRow = {
  id: string;
  especialidade: string;
  created_at: string;
  paciente: {
    primeiro_nome: string;
    ultimo_nome: string | null;
    wa_id: string;
  } | null;
};

function formatTempo(ms: number): string {
  if (ms < 60_000) return "agora";
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  if (h < 24) return r ? `${h}h ${r}min` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function FilaTable({ rows, basePath = "" }: { rows: FilaRow[]; basePath?: string }) {
  const now = Date.now();
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
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--d-text)" }}>
            Em fila sem atendimento
          </div>
          <div style={{ fontSize: 12, color: "var(--d-text-3)", marginTop: 2 }}>
            {rows.length === 0
              ? "Nenhuma conversa aguardando"
              : `${rows.length} conversa(s) — mais antigas primeiro`}
          </div>
        </div>
      </div>
      {rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "var(--d-text-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ textAlign: "left", padding: "10px 24px", fontWeight: 600 }}>Nome</th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600 }}>Telefone</th>
                <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600 }}>Categoria</th>
                <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600 }}>Aberta há</th>
                <th style={{ padding: "10px 24px" }} aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const nome = r.paciente
                  ? `${r.paciente.primeiro_nome} ${r.paciente.ultimo_nome ?? ""}`.trim()
                  : "—";
                const tempo = formatTempo(now - new Date(r.created_at).getTime());
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--d-border)" }}>
                    <td style={{ padding: "10px 24px", color: "var(--d-text)", fontWeight: 500 }}>
                      {nome}
                    </td>
                    <td style={{ padding: "10px 16px", color: "var(--d-text-2)" }}>
                      {r.paciente?.wa_id ?? "—"}
                    </td>
                    <td style={{ padding: "10px 16px", color: "var(--d-text-2)", textTransform: "capitalize" }}>
                      {r.especialidade}
                    </td>
                    <td className="tnum" style={{ padding: "10px 16px", color: "var(--d-warn)", fontWeight: 600, textAlign: "right" }}>
                      {tempo}
                    </td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
