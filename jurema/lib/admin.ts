import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export type AdminContext = { userId: string };

/**
 * Garante que o request vem de um especialista com `role='admin'` e ativo.
 * Em caso de falha, retorna NextResponse pronto (401/403). Em caso de
 * sucesso, retorna o contexto admin. Use o discriminador `error` para
 * encurtar circuito na rota.
 */
export async function requireAdmin(): Promise<
  | { error: NextResponse; ctx?: never }
  | { error?: never; ctx: AdminContext }
> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const { data: perfil } = await supabase
    .from("jurema_especialistas")
    .select("role, ativo")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!perfil?.ativo || perfil.role !== "admin") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ctx: { userId: user.id } };
}
