import { NextResponse } from "next/server";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const { codigo } = await params;
  const body = await req.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if (typeof body.rotulo === "string" && body.rotulo.trim()) patch.rotulo = body.rotulo.trim();
  if (Number.isFinite(body.ordem)) patch.ordem = Number(body.ordem);
  if (typeof body.ativo === "boolean") patch.ativo = body.ativo;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nada_a_atualizar" }, { status: 400 });
  }

  const svc = createSupabaseServiceRole();
  const { data, error } = await svc
    .from("jurema_especialidades")
    .update(patch)
    .eq("codigo", codigo)
    .select("codigo")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  if (!data) return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
