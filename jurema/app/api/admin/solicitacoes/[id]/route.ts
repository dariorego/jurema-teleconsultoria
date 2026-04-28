import { NextResponse } from "next/server";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

const STATUS_OK = ["pendente", "em_andamento", "concluido", "cancelado"] as const;
type Status = (typeof STATUS_OK)[number];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if (typeof body.status === "string" && (STATUS_OK as readonly string[]).includes(body.status)) {
    patch.status = body.status as Status;
  }
  if ("observacoes" in body) {
    patch.observacoes = typeof body.observacoes === "string" ? body.observacoes : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nada_a_atualizar" }, { status: 400 });
  }

  const svc = createSupabaseServiceRole();

  // Lê estado atual para decidir efeitos colaterais (encaminhamento ao especialista).
  const { data: atual, error: getErr } = await svc
    .from("jurema_solicitacoes")
    .select("id, paciente_id, especialidade, modalidade, observacoes, conversa_id")
    .eq("id", id)
    .maybeSingle();
  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 502 });
  if (!atual) return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });

  // Aplica o patch.
  const { error: updErr } = await svc
    .from("jurema_solicitacoes")
    .update(patch)
    .eq("id", id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 502 });

  // Encaminhamento: se a admin concluiu uma solicitação de videoconferência
  // (modalidade=teleatendimento) que ainda não tinha conversa atrelada,
  // criamos uma nova conversa em "fila" pra que o especialista da categoria
  // assuma o atendimento na Caixa dele.
  let novaConversaId: string | null = null;
  if (
    patch.status === "concluido" &&
    atual.modalidade === "teleatendimento" &&
    !atual.conversa_id
  ) {
    const { data: conv, error: convErr } = await svc
      .from("jurema_conversas")
      .insert({
        paciente_id: atual.paciente_id,
        especialidade: atual.especialidade,
        status: "fila",
      })
      .select("id")
      .single();

    if (convErr || !conv) {
      // Não falhamos a request — a solicitação já foi marcada como concluída.
      // Reportamos o erro de encaminhamento para o admin.
      return NextResponse.json({
        ok: true,
        conversa_id: null,
        encaminhamento_erro: convErr?.message ?? "sem retorno",
        message:
          "Solicitação marcada como atendida, mas houve erro ao criar conversa para o especialista.",
      });
    }

    novaConversaId = conv.id;

    // Vincula a solicitação à nova conversa para auditoria.
    await svc
      .from("jurema_solicitacoes")
      .update({ conversa_id: novaConversaId })
      .eq("id", id);

    // Mensagem de sistema com as observações (link/data) para o especialista
    // ver assim que puxar a conversa.
    const obs = (typeof patch.observacoes === "string" ? patch.observacoes : null) ?? atual.observacoes;
    if (obs) {
      const { data: paciente } = await svc
        .from("jurema_pacientes")
        .select("wa_id")
        .eq("id", atual.paciente_id)
        .maybeSingle();
      if (paciente?.wa_id) {
        await svc.from("jurema_mensagens").insert({
          conversa_id: novaConversaId,
          wa_id: paciente.wa_id,
          direction: "outbound",
          tipo: "system",
          content: `📅 Videochamada agendada pelo admin:\n\n${obs}`,
          status: "sent",
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    conversa_id: novaConversaId,
    message: novaConversaId
      ? "Solicitação atendida. Uma conversa foi enviada para a fila do especialista."
      : undefined,
  });
}
