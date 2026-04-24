"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { Mensagem } from "@/lib/types";

type Conversa = {
  id: string;
  status: "fila" | "em_atendimento" | "encerrada";
  especialidade: string;
  especialista_id: string | null;
  janela_expira_at: string | null;
  paciente: {
    id: string;
    wa_id: string;
    primeiro_nome: string;
    ultimo_nome: string | null;
    cpf: string | null;
    hospital: string | null;
  } | null;
};

export function ChatWindow({
  conversa,
  initialMensagens,
  userId,
}: {
  conversa: Conversa;
  initialMensagens: Mensagem[];
  userId: string;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [mensagens, setMensagens] = useState<Mensagem[]>(initialMensagens);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fim = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${conversa.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "jurema_mensagens",
          filter: `conversa_id=eq.${conversa.id}`,
        },
        (payload) => {
          const m = payload.new as Mensagem;
          setMensagens((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.direction === "inbound") {
            try { new Audio("/sounds/notify.mp3").play().catch(() => {}); } catch {}
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jurema_conversas",
          filter: `id=eq.${conversa.id}`,
        },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversa.id, supabase, router]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    setEnviando(true);
    const res = await fetch("/api/mensagens/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversaId: conversa.id, texto: t }),
    });
    setEnviando(false);
    if (res.ok) setTexto("");
    else {
      const j = await res.json().catch(() => ({}));
      alert(`Erro: ${j.error ?? res.statusText}`);
    }
  }

  async function enviarArquivo(file: File) {
    if (uploading) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("conversaId", conversa.id);
    fd.append("file", file);
    if (texto.trim()) fd.append("caption", texto.trim());
    const res = await fetch("/api/mensagens/enviar-arquivo", {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    if (res.ok) {
      setTexto("");
      if (fileInput.current) fileInput.current.value = "";
    } else {
      const j = await res.json().catch(() => ({}));
      alert(`Erro ao enviar arquivo: ${j.error ?? res.statusText}${j.detail ? ` — ${j.detail}` : ""}`);
    }
  }

  async function encerrar() {
    if (!confirm("Encerrar esta conversa?")) return;
    const res = await fetch(`/api/conversas/${conversa.id}/encerrar`, { method: "POST" });
    if (res.ok) router.push("/caixa");
    else alert("Erro ao encerrar");
  }

  const nome = conversa.paciente
    ? `${conversa.paciente.primeiro_nome} ${conversa.paciente.ultimo_nome ?? ""}`.trim()
    : "Paciente";

  const minha = conversa.especialista_id === userId;
  const janelaExpira = conversa.janela_expira_at
    ? new Date(conversa.janela_expira_at).getTime() - Date.now()
    : null;
  const janelaPorHoras = janelaExpira != null ? Math.floor(janelaExpira / 3_600_000) : null;

  return (
    <div className="h-screen grid grid-rows-[auto_1fr_auto]">
      <header className="px-6 py-3 bg-whatsapp-panel border-b border-whatsapp-border flex items-center justify-between">
        <div>
          <div className="text-whatsapp-text font-medium">{nome}</div>
          <div className="text-xs text-whatsapp-muted">
            {conversa.paciente?.wa_id}
            {conversa.paciente?.hospital ? ` • ${conversa.paciente.hospital}` : ""}
            {conversa.paciente?.cpf ? ` • CPF ${conversa.paciente.cpf}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {janelaPorHoras != null && (
            <span
              className={`text-xs ${
                janelaPorHoras < 2 ? "text-yellow-400" : "text-whatsapp-muted"
              }`}
            >
              Janela: {janelaPorHoras}h
            </span>
          )}
          {minha && conversa.status === "em_atendimento" && (
            <button
              onClick={encerrar}
              className="px-3 py-1.5 rounded text-sm border border-whatsapp-border text-whatsapp-text hover:bg-whatsapp-panel2"
            >
              Encerrar
            </button>
          )}
        </div>
      </header>

      <div className="overflow-y-auto px-6 py-4 space-y-2 bg-whatsapp-bg">
        {mensagens.map((m) => (
          <Bolha key={m.id} m={m} />
        ))}
        <div ref={fim} />
      </div>

      <form onSubmit={enviar} className="p-3 bg-whatsapp-panel border-t border-whatsapp-border flex gap-2 items-center">
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void enviarArquivo(f);
          }}
        />
        <button
          type="button"
          aria-label="Anexar arquivo"
          onClick={() => fileInput.current?.click()}
          disabled={!minha || conversa.status !== "em_atendimento" || uploading}
          className="p-2 rounded-lg text-whatsapp-muted hover:text-whatsapp-text hover:bg-whatsapp-panel2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={uploading ? "Enviando…" : "Anexar arquivo"}
        >
          <Paperclip size={18} />
        </button>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={
            conversa.status === "encerrada"
              ? "Conversa encerrada"
              : minha
                ? uploading
                  ? "Enviando arquivo…"
                  : "Digite uma mensagem"
                : "Puxe a conversa para responder"
          }
          disabled={!minha || conversa.status !== "em_atendimento" || enviando || uploading}
          className="flex-1 px-4 py-2 rounded-lg bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text focus:outline-none focus:border-whatsapp-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!minha || conversa.status !== "em_atendimento" || enviando || uploading || !texto.trim()}
          className="px-4 py-2 rounded-lg bg-whatsapp-accent text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

function Bolha({ m }: { m: Mensagem }) {
  const inbound = m.direction === "inbound";
  const mediaUrl = m.media_path ? `/api/mensagens/${m.id}/media` : null;
  const isImage = mediaUrl && m.media_mime?.startsWith("image/");
  return (
    <div className={`flex ${inbound ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[70%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
          inbound ? "bg-whatsapp-bubbleIn text-whatsapp-text" : "bg-whatsapp-bubbleOut text-white"
        }`}
      >
        {mediaUrl && (
          <div className="mb-1">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt={m.content ?? "Imagem"}
                className="rounded max-w-full max-h-64 object-contain"
              />
            ) : (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 underline underline-offset-2"
              >
                📎 {m.content ?? "Arquivo"}
              </a>
            )}
          </div>
        )}
        {!mediaUrl && (m.content ?? <em className="opacity-70">({m.tipo})</em>)}
        {mediaUrl && m.content && m.content !== "Arquivo" && (
          <div className="text-xs opacity-90">{m.content}</div>
        )}
        <div className="text-[10px] opacity-60 mt-1 text-right">
          {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          {!inbound && m.status ? ` • ${m.status}` : ""}
        </div>
      </div>
    </div>
  );
}
