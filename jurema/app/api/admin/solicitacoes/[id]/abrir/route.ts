import { NextResponse } from "next/server";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

/**
 * Abre o atendimento de uma solicitação de videoconferência.
 *
 * - Cria (ou reaproveita) uma jurema_conversas atribuída ao admin
 *   (status='em_atendimento', especialista_id=admin.userId).
 * - Atualiza solicitacao.conversa_id e solicitacao.status='em_andamento'.
 * - O admin pode então enviar o link/instruções pelo chat normalmente.
 * - Quando o admin marcar a solicitação como "Atendida" depois (PATCH
 *   status=concluido), a MESMA conversa muda pra fila do especialista
 *   da categoria, preservando todo o histórico de mensagens.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const { id } = await params;
  const svc = createSupabaseServiceRole();

  const { data: sol, error: getErr } = await svc
    .from("jurema_solicitacoes")
    .select("id, paciente_id, especialidade, modalidade, status, conversa_id")
    .eq("id", id)
    .maybeSingle();
  if (getErr) return NextResponse.json({ error: getErr.message }, { status: 502 });
  if (!sol) return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });
  if (sol.modalidade !== "teleatendimento") {
    return NextResponse.json({ error: "modalidade_invalida" }, { status: 400 });
  }

  // Idempotente: se já tem conversa atrelada, reaproveita.
  if (sol.conversa_id) {
    // Garante que a conversa esteja atribuída ao admin atual e em atendimento
    // (caso outro admin tenha aberto antes e desistido).
    await svc
      .from("jurema_conversas")
      .update({ status: "em_atendimento", especialista_id: gate.ctx.userId })
      .eq("id", sol.conversa_id);
    return NextResponse.json({ ok: true, conversa_id: sol.conversa_id, reused: true });
  }

  // Cria nova conversa em atendimento atribuída ao admin.
  const { data: conv, error: convErr } = await svc
    .from("jurema_conversas")
    .insert({
      paciente_id: sol.paciente_id,
      especialidade: sol.especialidade,
      status: "em_atendimento",
      especialista_id: gate.ctx.userId,
    })
    .select("id")
    .single();
  if (convErr || !conv) {
    return NextResponse.json(
      { error: "criar_conversa_falhou", detail: convErr?.message },
      { status: 502 },
    );
  }

  // Marca a solicitação como em_andamento (admin assumiu) e atrela à conversa.
  await svc
    .from("jurema_solicitacoes")
    .update({ status: "em_andamento", conversa_id: conv.id })
    .eq("id", id);

  return NextResponse.json({ ok: true, conversa_id: conv.id, reused: false });
}
