import { NextResponse } from "next/server";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const body = await req.json().catch(() => ({}));
  const email: string | undefined = body.email?.trim().toLowerCase();
  const nome: string | undefined = body.nome?.trim();
  const especialidade: string | null = body.especialidade?.trim() || null;
  const role: "especialista" | "admin" = body.role === "admin" ? "admin" : "especialista";

  if (!email || !nome) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const svc = createSupabaseServiceRole();

  // 1) O Supabase Auth pode ter o email registrado por outra aplicação que
  //    compartilha o mesmo projeto. Nesse caso `inviteUserByEmail` falha
  //    silenciosamente (ou retorna erro pouco descritivo) e nenhum email
  //    é enviado. Verificamos a existência primeiro.
  let userId: string | null = null;
  let alreadyExisted = false;
  let preexistingConfirmed = false;

  // listUsers tem paginação; buscamos até achar (ou esgotar). Para projetos
  // pequenos uma página resolve. Se virar gargalo no futuro, trocar pela
  // chamada REST direta em /auth/v1/admin/users?email=...
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) {
      userId = found.id;
      alreadyExisted = true;
      preexistingConfirmed = !!found.email_confirmed_at || !!found.last_sign_in_at;
      break;
    }
    if (data.users.length < 200) break;
  }

  // 2) Se não existia, dispara invite (cria em auth.users + envia magic link).
  if (!userId) {
    const invite = await svc.auth.admin.inviteUserByEmail(email, { data: { nome } });
    if (invite.error || !invite.data.user) {
      return NextResponse.json(
        { error: "invite_failed", detail: invite.error?.message ?? "sem usuario retornado" },
        { status: 502 },
      );
    }
    userId = invite.data.user.id;
  }

  // 3) Se já existe perfil em jurema_especialistas, retorna conflito explícito.
  const { data: existingPerfil } = await svc
    .from("jurema_especialistas")
    .select("user_id, nome, ativo")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingPerfil) {
    return NextResponse.json(
      {
        error: "ja_cadastrado",
        detail: `Esse email já está vinculado ao especialista "${existingPerfil.nome}" (${existingPerfil.ativo ? "ativo" : "inativo"}).`,
        user_id: userId,
      },
      { status: 409 },
    );
  }

  // 4) Cria o vínculo em jurema_especialistas.
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

  // 5) Resposta com aviso quando reaproveitou usuário pré-existente.
  if (alreadyExisted) {
    return NextResponse.json({
      ok: true,
      user_id: userId,
      reused: true,
      confirmed: preexistingConfirmed,
      message: preexistingConfirmed
        ? "Usuário já existia em outra aplicação no mesmo Supabase. A senha que ele usa lá continua válida aqui — não foi enviado novo convite. Se preferir trocar, use 'Reenviar convite'."
        : "Usuário já existia em outra aplicação mas ainda não confirmou a senha. Use 'Reenviar convite' na lista para gerar um link de definição de senha.",
    });
  }

  return NextResponse.json({
    ok: true,
    user_id: userId,
    reused: false,
    message: "Convite enviado por email. O usuário deve clicar no link para definir a senha.",
  });
}
