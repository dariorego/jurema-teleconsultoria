"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, X } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type Row = {
  id: string;
  status: "fila" | "em_atendimento" | "encerrada";
  especialidade: string;
  especialista_id: string | null;
  ultima_mensagem_at: string | null;
  ultima_inbound_at: string | null;
  created_at: string;
  paciente: {
    id: string;
    wa_id: string;
    primeiro_nome: string;
    ultimo_nome: string | null;
    hospital: string | null;
  } | null;
};

export function CaixaLive({ initial, userId }: { initial: Row[]; userId: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [rows, setRows] = useState<Row[]>(initial);
  const [puxando, setPuxando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("caixa-conversas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jurema_conversas" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "jurema_mensagens", filter: "direction=eq.inbound" },
        () => {
          try { new Audio("/sounds/notify.mp3").play().catch(() => {}); } catch {}
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  useEffect(() => setRows(initial), [initial]);

  async function puxar(id: string) {
    setPuxando(id);
    setErro(null);
    const res = await fetch(`/api/conversas/${id}/puxar`, { method: "POST" });
    setPuxando(null);
    if (res.ok) {
      router.push(`/chat/${id}`);
      return;
    }
    const body = await res.json().catch(() => ({}));
    const motivo: Record<string, string> = {
      unauthorized: "Sessão expirada. Faça login novamente.",
      perfil_inativo: "Seu perfil de especialista está inativo ou não cadastrado.",
      indisponivel: "Conversa indisponível: pode ter sido puxada por outro especialista, já não estar em fila, ou não ser da sua categoria.",
    };
    setErro(motivo[body?.error] ?? `Erro ao puxar conversa (${res.status}): ${body?.error ?? "desconhecido"}`);
  }

  const fila = rows.filter((r) => r.status === "fila");
  const minhas = rows.filter((r) => r.status === "em_atendimento" && r.especialista_id === userId);
  const outrosEmAtendimento = rows.filter(
    (r) => r.status === "em_atendimento" && r.especialista_id !== userId,
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {erro && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 rounded-lg text-sm"
          style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{erro}</span>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setErro(null)}
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <Secao titulo={`Fila (${fila.length})`}>
        {fila.length === 0 && <Vazio texto="Nenhuma conversa na fila." />}
        {fila.map((r) => (
          <Cartao key={r.id} r={r}>
            <button
              type="button"
              onClick={() => puxar(r.id)}
              disabled={puxando === r.id}
              className="px-3 py-1.5 rounded bg-whatsapp-accent text-white text-sm font-medium transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {puxando === r.id ? "Puxando…" : "Puxar"}
            </button>
          </Cartao>
        ))}
      </Secao>

      <Secao titulo={`Minhas em atendimento (${minhas.length})`}>
        {minhas.length === 0 && <Vazio texto="Você não está em nenhum atendimento." />}
        {minhas.map((r) => (
          <Cartao key={r.id} r={r}>
            <Link
              href={`/chat/${r.id}` as never}
              className="px-3 py-1.5 rounded bg-whatsapp-panel2 text-whatsapp-text text-sm border border-whatsapp-border transition hover:border-whatsapp-accent"
            >
              Abrir chat
            </Link>
          </Cartao>
        ))}
      </Secao>

      {outrosEmAtendimento.length > 0 && (
        <Secao titulo={`Em atendimento com outros (${outrosEmAtendimento.length})`}>
          {outrosEmAtendimento.map((r) => (
            <Cartao key={r.id} r={r} dim>
              <span className="text-xs text-whatsapp-muted">ocupada</span>
            </Cartao>
          ))}
        </Secao>
      )}
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider text-whatsapp-muted mb-3">{titulo}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <p className="text-sm text-whatsapp-muted italic">{texto}</p>;
}

function Cartao({
  r,
  children,
  dim,
}: {
  r: Row;
  children: React.ReactNode;
  dim?: boolean;
}) {
  const nome =
    r.paciente ? `${r.paciente.primeiro_nome} ${r.paciente.ultimo_nome ?? ""}`.trim() : r.id;
  const when = r.ultima_inbound_at ?? r.created_at;
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg bg-whatsapp-panel border border-whatsapp-border ${
        dim ? "opacity-60" : ""
      }`}
    >
      <div>
        <div className="text-whatsapp-text font-medium">{nome}</div>
        <div className="text-xs text-whatsapp-muted">
          {r.paciente?.wa_id}
          {r.paciente?.hospital ? ` • ${r.paciente.hospital}` : ""}
          {" • "}
          {new Date(when).toLocaleString("pt-BR")}
        </div>
      </div>
      {children}
    </div>
  );
}
