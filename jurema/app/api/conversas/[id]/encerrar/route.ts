import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseServiceRole } from "@/lib/supabase/server";
import { sendList } from "@/lib/turnio";

const SURVEY_BODY =
  "Seu atendimento foi encerrado. Avalie de 1 a 5, sendo 1 muito ruim e 5 muito bom.";
const SURVEY_ROWS = [
  { id: "rating:1", title: "1 - Muito ruim" },
  { id: "rating:2", title: "2 - Ruim" },
  { id: "rating:3", title: "3 - Regular" },
  { id: "rating:4", title: "4 - Bom" },
  { id: "rating:5", title: "5 - Muito bom" },
];

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = createSupabaseServiceRole();

  const { data: conv } = await svc
    .from("jurema_conversas")
    .select(`
      especialista_id, paciente_id, especialidade, status,
      paciente:jurema_pacientes(wa_id)
    `)
    .eq("id", id)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: "nao_encontrada" }, { status: 404 });
  if (conv.especialista_id !== user.id) {
    const { data: perfil } = await svc
      .from("jurema_especialistas")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (perfil?.role !== "admin")
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (conv.status !== "em_atendimento") {
    return NextResponse.json({ error: "status_invalido", status: conv.status }, { status: 409 });
  }

  const paciente = Array.isArray(conv.paciente) ? conv.paciente[0] : conv.paciente;
  const wa_id = paciente?.wa_id;
  if (!wa_id) return NextResponse.json({ error: "sem_wa_id" }, { status: 400 });

  // 1) Envia lista interativa 1-5
  let surveyTurnId: string | null = null;
  try {
    const resp = await sendList(wa_id, SURVEY_BODY, "Avaliar", SURVEY_ROWS, "Avaliação");
    surveyTurnId = resp.messages?.[0]?.id ?? null;
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "turnio_failed", detail }, { status: 502 });
  }

  // 2) Muda para aguardando_avaliacao e registra a mensagem enviada
  const agora = new Date().toISOString();
  await svc
    .from("jurema_conversas")
    .update({ status: "aguardando_avaliacao", ultima_mensagem_at: agora })
    .eq("id", id);

  await svc.from("jurema_mensagens").insert({
    conversa_id: id,
    wa_id,
    direction: "outbound",
    autor_user_id: user.id,
    tipo: "interactive",
    content: SURVEY_BODY,
    turn_message_id: surveyTurnId,
    status: "sent",
    raw: { interactive: { type: "list", rows: SURVEY_ROWS } },
  });

  // 3) Registra a solicitação como concluída (conforme fluxo anterior)
  await svc.from("jurema_solicitacoes").insert({
    paciente_id: conv.paciente_id,
    especialidade: conv.especialidade,
    modalidade: "texto",
    status: "concluido",
    especialista_id: conv.especialista_id,
    conversa_id: id,
  });

  // A conversa só vira 'encerrada' quando o paciente responder 1..5
  // (trigger jurema_capture_avaliacao em jurema_mensagens).
  return NextResponse.json({ ok: true, aguardando_avaliacao: true });
}
