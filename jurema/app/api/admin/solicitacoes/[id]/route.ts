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
  const { data, error } = await svc
    .from("jurema_solicitacoes")
    .update(patch)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  if (!data) return NextResponse.json({ error: "nao_encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
