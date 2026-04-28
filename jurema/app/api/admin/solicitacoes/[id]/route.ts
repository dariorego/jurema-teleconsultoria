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

  // Encaminhamento ao especialista quando admin conclui uma videoconferência:
  //
  // a) Conversa JÁ existe (admin clicou "Abrir" antes — fluxo recomendado):
  //    devolve a MESMA conversa pra fila do especialista preservando todo
  //    o histórico de mensagens trocadas pelo admin.
  //
  // b) Conversa NÃO existe (admin clicou "Atendida" direto sem chat):
  //    cria uma nova conversa em fila + uma mensagem de sistema com as
  //    observações (link/data) para o especialista ver ao puxar.
  let conversaId: string | null = null;
  let modoEncaminhamento: "reaproveitada" | "criada" | null = null;
  if (patch.status === "concluido" && atual.modalidade === "teleatendimento") {
    if (atual.conversa_id) {
      // (a) Reaproveita: volta pra fila, libera atribuição.
      const { error: e } = await svc
        .from("jurema_conversas")
        .update({ status: "fila", especialista_id: null })
        .eq("id", atual.conversa_id);
      if (!e) {
        conversaId = atual.conversa_id;
        modoEncaminhamento = "reaproveitada";
      }
    } else {
      // (b) Cria nova conversa em fila.
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
        return NextResponse.json({
          ok: true,
          conversa_id: null,
          encaminhamento_erro: convErr?.message ?? "sem retorno",
          message:
            "Solicitação marcada como atendida, mas houve erro ao criar conversa para o especialista.",
        });
      }
      conversaId = conv.id;
      modoEncaminhamento = "criada";

      // Vincula a solicitação à nova conversa.
      await svc
        .from("jurema_solicitacoes")
        .update({ conversa_id: conversaId })
        .eq("id", id);

      // Mensagem de sistema com as observações (link/data).
      const obs = (typeof patch.observacoes === "string" ? patch.observacoes : null) ?? atual.observacoes;
      if (obs) {
        const { data: paciente } = await svc
          .from("jurema_pacientes")
          .select("wa_id")
          .eq("id", atual.paciente_id)
          .maybeSingle();
        if (paciente?.wa_id) {
          await svc.from("jurema_mensagens").insert({
            conversa_id: conversaId,
            wa_id: paciente.wa_id,
            direction: "outbound",
            tipo: "system",
            content: `📅 Videochamada agendada pelo admin:\n\n${obs}`,
            status: "sent",
          });
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    conversa_id: conversaId,
    modo: modoEncaminhamento,
    message: conversaId
      ? modoEncaminhamento === "reaproveitada"
        ? "Solicitação atendida. A conversa voltou para a fila do especialista com todo o histórico preservado."
        : "Solicitação atendida. Uma conversa foi enviada para a fila do especialista."
      : undefined,
  });
}
