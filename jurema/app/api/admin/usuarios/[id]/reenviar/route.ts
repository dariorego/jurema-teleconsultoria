import { NextResponse } from "next/server";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

/**
 * Reenvia o convite / link de definição de senha para o email do usuário.
 * Usado quando:
 * - O convite original não chegou (spam, SMTP intermitente).
 * - O usuário foi reaproveitado de outra aplicação no mesmo Supabase e
 *   nunca recebeu link de definição de senha pela JUREMA.
 * - O usuário esqueceu a senha.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const { id } = await params;
  const svc = createSupabaseServiceRole();

  const { data: user, error: getErr } = await svc.auth.admin.getUserById(id);
  if (getErr || !user.user?.email) {
    return NextResponse.json(
      { error: "usuario_nao_encontrado", detail: getErr?.message },
      { status: 404 },
    );
  }
  const email = user.user.email;

  // generateLink: cria magic link de definição/redefinição de senha. O Supabase
  // dispara o email automaticamente se SMTP estiver configurado. Caso contrário,
  // retorna o link no `data.properties.action_link` para o admin enviar manualmente.
  const { data, error } = await svc.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error) {
    return NextResponse.json(
      { error: "generate_link_failed", detail: error.message },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    email,
    message:
      "Link de redefinição de senha gerado. Se o SMTP estiver configurado, o usuário recebe automaticamente; caso contrário, copie e envie manualmente.",
    action_link: data.properties?.action_link ?? null,
  });
}
