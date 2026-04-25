import { NextResponse } from "next/server";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if (typeof body.nome === "string" && body.nome.trim()) patch.nome = body.nome.trim();
  if ("especialidade" in body) patch.especialidade = body.especialidade || null;
  if (body.role === "admin" || body.role === "especialista") patch.role = body.role;
  if (typeof body.ativo === "boolean") patch.ativo = body.ativo;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nada_a_atualizar" }, { status: 400 });
  }

  // Anti foot-gun: admin não pode rebaixar/desativar a si mesmo.
  if (id === gate.ctx.userId && (patch.role === "especialista" || patch.ativo === false)) {
    return NextResponse.json({ error: "self_demotion_bloqueado" }, { status: 400 });
  }

  const svc = createSupabaseServiceRole();
  const { data, error } = await svc
    .from("jurema_especialistas")
    .update(patch)
    .eq("user_id", id)
    .select("user_id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  if (!data) return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
