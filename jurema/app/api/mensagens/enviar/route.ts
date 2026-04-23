import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseServiceRole } from "@/lib/supabase/server";
import { sendText } from "@/lib/turnio";

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const conversaId: string | undefined = body.conversaId;
  const texto: string | undefined = body.texto;
  if (!conversaId || !texto?.trim())
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  const svc = createSupabaseServiceRole();

  const { data: conv } = await svc
    .from("jurema_conversas")
    .select(`
      id, status, especialista_id, janela_expira_at,
      paciente:jurema_pacientes(wa_id)
    `)
    .eq("id", conversaId)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: "nao_encontrada" }, { status: 404 });
  if (conv.especialista_id !== user.id)
    return NextResponse.json({ error: "nao_atribuida" }, { status: 403 });
  if (conv.status !== "em_atendimento")
    return NextResponse.json({ error: "status_invalido" }, { status: 409 });

  const paciente = Array.isArray(conv.paciente) ? conv.paciente[0] : conv.paciente;
  const wa_id = paciente?.wa_id;
  if (!wa_id) return NextResponse.json({ error: "sem_wa_id" }, { status: 400 });

  let turnId: string | null = null;
  let statusMsg = "sent";
  try {
    const resp = await sendText(wa_id, texto);
    turnId = resp.messages?.[0]?.id ?? null;
  } catch (e: any) {
    statusMsg = "failed";
    await svc.from("jurema_mensagens").insert({
      conversa_id: conversaId,
      wa_id,
      direction: "outbound",
      autor_user_id: user.id,
      tipo: "text",
      content: texto,
      status: "failed",
      raw: { error: String(e?.message ?? e) },
    });
    return NextResponse.json({ error: "turnio_failed", detail: String(e?.message ?? e) }, { status: 502 });
  }

  const agora = new Date().toISOString();
  await svc.from("jurema_mensagens").insert({
    conversa_id: conversaId,
    wa_id,
    direction: "outbound",
    autor_user_id: user.id,
    tipo: "text",
    content: texto,
    turn_message_id: turnId,
    status: statusMsg,
  });

  await svc
    .from("jurema_conversas")
    .update({ ultima_mensagem_at: agora })
    .eq("id", conversaId);

  return NextResponse.json({ ok: true, turn_message_id: turnId });
}
