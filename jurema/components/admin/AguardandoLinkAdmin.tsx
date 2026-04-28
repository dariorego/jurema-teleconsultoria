"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageSquare, X } from "lucide-react";
import { apiUrl } from "@/lib/basePath";

export type SolicitacaoLink = {
  id: string;
  especialidade_codigo: string;
  especialidade_rotulo: string;
  observacoes: string | null;
  created_at: string;
  paciente: {
    primeiro_nome: string;
    ultimo_nome: string | null;
    wa_id: string;
    hospital: string | null;
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

export function AguardandoLinkAdmin({ initial }: { initial: SolicitacaoLink[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);
  const now = Date.now();

  async function patch(id: string, body: Record<string, unknown>) {
    setSavingId(id);
    const res = await fetch(apiUrl(`/api/admin/solicitacoes/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSavingId(null);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(`Erro: ${j.error}${j.detail ? ` — ${j.detail}` : ""}`);
      return null;
    }
    start(() => router.refresh());
    return j as { ok: boolean; conversa_id?: string | null; message?: string };
  }

  async function abrir(s: SolicitacaoLink) {
    setSavingId(s.id);
    const res = await fetch(apiUrl(`/api/admin/solicitacoes/${s.id}/abrir`), {
      method: "POST",
    });
    setSavingId(null);
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.conversa_id) {
      alert(`Erro ao abrir conversa: ${j.error ?? res.statusText}`);
      return;
    }
    router.push(`/chat/${j.conversa_id}` as never);
  }

  async function marcarAtendida(s: SolicitacaoLink) {
    const nome = s.paciente
      ? `${s.paciente.primeiro_nome} ${s.paciente.ultimo_nome ?? ""}`.trim()
      : "este paciente";
    if (
      !confirm(
        `Marcar a videoconferência de ${nome} como atendida?\n\n` +
          `A solicitação sai daqui e uma nova conversa entra na fila do especialista de ${s.especialidade_rotulo} para o acompanhamento.`,
      )
    )
      return;
    const result = await patch(s.id, { status: "concluido" });
    if (result?.message) alert(result.message);
  }

  async function cancelar(s: SolicitacaoLink) {
    if (!confirm("Cancelar essa solicitação? (Histórico permanece, mas sai da fila.)")) return;
    await patch(s.id, { status: "cancelado" });
  }

  return (
    <section className="space-y-3">
      <p className="text-sm text-whatsapp-muted">
        {initial.length === 0
          ? "Nenhuma videoconferência aguardando agendamento."
          : `${initial.length} solicitação(ões) pendente(s) — mais antigas primeiro.`}
      </p>

      <div className="border border-whatsapp-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-whatsapp-panel text-whatsapp-muted">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Nome</th>
              <th className="text-left px-3 py-2 font-medium">Telefone</th>
              <th className="text-left px-3 py-2 font-medium">Categoria</th>
              <th className="text-left px-3 py-2 font-medium">Hospital</th>
              <th className="text-right px-3 py-2 font-medium">Aguardando há</th>
              <th className="text-left px-3 py-2 font-medium">Observações</th>
              <th className="text-right px-3 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {initial.map((s) => {
              const nome = s.paciente
                ? `${s.paciente.primeiro_nome} ${s.paciente.ultimo_nome ?? ""}`.trim()
                : "—";
              const tempo = formatTempo(now - new Date(s.created_at).getTime());
              const saving = savingId === s.id;
              return (
                <tr key={s.id} className="border-t border-whatsapp-border align-top">
                  <td className="px-3 py-2 text-whatsapp-text">{nome}</td>
                  <td className="px-3 py-2 text-whatsapp-muted">{s.paciente?.wa_id ?? "—"}</td>
                  <td className="px-3 py-2 text-whatsapp-muted">{s.especialidade_rotulo}</td>
                  <td className="px-3 py-2 text-whatsapp-muted">{s.paciente?.hospital ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-yellow-500 font-medium">{tempo}</td>
                  <td className="px-3 py-2">
                    <input
                      defaultValue={s.observacoes ?? ""}
                      placeholder="Link / data / observação"
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (s.observacoes ?? "")) patch(s.id, { observacoes: v || null });
                      }}
                      className="w-full min-w-[200px] px-2 py-1 rounded bg-transparent border border-transparent hover:border-whatsapp-border focus:border-whatsapp-accent focus:bg-whatsapp-panel2 focus:outline-none text-whatsapp-text text-xs"
                    />
                  </td>
                  <td className="px-3 py-2 text-right space-x-1 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => abrir(s)}
                      disabled={saving}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-whatsapp-accent text-whatsapp-accent hover:bg-whatsapp-accent/10 disabled:opacity-50"
                      title="Abrir conversa para enviar o link via chat"
                    >
                      <MessageSquare size={13} /> Abrir
                    </button>
                    <button
                      type="button"
                      onClick={() => marcarAtendida(s)}
                      disabled={saving}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-whatsapp-accent text-white hover:opacity-90 disabled:opacity-50"
                      title="Marcar como atendida (link já enviado) e devolver à fila do especialista"
                    >
                      <CheckCircle2 size={13} /> Atendida
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelar(s)}
                      disabled={saving}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-whatsapp-border text-whatsapp-muted hover:text-whatsapp-text hover:bg-whatsapp-panel2 disabled:opacity-50"
                      title="Cancelar solicitação"
                    >
                      <X size={13} /> Cancelar
                    </button>
                  </td>
                </tr>
              );
            })}
            {initial.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-whatsapp-muted italic">
                  Nenhuma videoconferência aguardando agendamento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pending && (
        <p className="text-xs text-whatsapp-muted">Atualizando…</p>
      )}
    </section>
  );
}
