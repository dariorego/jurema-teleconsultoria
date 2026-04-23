import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseServiceRole } from "@/lib/supabase/server";

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
    .select("especialista_id, paciente_id, especialidade")
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

  const agora = new Date().toISOString();
  await svc
    .from("jurema_conversas")
    .update({ status: "encerrada", encerrada_at: agora })
    .eq("id", id);

  await svc.from("jurema_solicitacoes").insert({
    paciente_id: conv.paciente_id,
    especialidade: conv.especialidade,
    modalidade: "texto",
    status: "concluido",
    especialista_id: conv.especialista_id,
    conversa_id: id,
  });

  return NextResponse.json({ ok: true });
}
