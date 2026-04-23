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

  const { data: perfil } = await supabase
    .from("jurema_especialistas")
    .select("especialidade, ativo, role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!perfil?.ativo) return NextResponse.json({ error: "perfil_inativo" }, { status: 403 });

  const svc = createSupabaseServiceRole();

  // Atribui apenas se ainda está em fila (evita corrida entre especialistas).
  const { data, error } = await svc
    .from("jurema_conversas")
    .update({ status: "em_atendimento", especialista_id: user.id })
    .eq("id", id)
    .eq("status", "fila")
    .eq("especialidade", perfil.especialidade ?? "")
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "indisponivel" }, { status: 409 });

  return NextResponse.json({ ok: true });
}
