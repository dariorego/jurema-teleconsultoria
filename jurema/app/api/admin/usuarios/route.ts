import { NextResponse } from "next/server";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const body = await req.json().catch(() => ({}));
  const email: string | undefined = body.email?.trim();
  const nome: string | undefined = body.nome?.trim();
  const especialidade: string | null = body.especialidade?.trim() || null;
  const role: "especialista" | "admin" = body.role === "admin" ? "admin" : "especialista";

  if (!email || !nome) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const svc = createSupabaseServiceRole();

  // Convite por email — Supabase cria usuário em auth.users e envia magic link.
  // Requer SMTP configurado no projeto.
  const invite = await svc.auth.admin.inviteUserByEmail(email, {
    data: { nome },
  });
  if (invite.error || !invite.data.user) {
    return NextResponse.json(
      { error: "invite_failed", detail: invite.error?.message ?? "sem usuario retornado" },
      { status: 502 },
    );
  }

  const userId = invite.data.user.id;

  const { error: insertError } = await svc.from("jurema_especialistas").insert({
    user_id: userId,
    nome,
    especialidade,
    role,
    ativo: true,
  });
  if (insertError) {
    return NextResponse.json(
      { error: "insert_failed", detail: insertError.message, user_id: userId },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, user_id: userId });
}
