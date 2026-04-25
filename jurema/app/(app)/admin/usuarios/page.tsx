import { createSupabaseServer } from "@/lib/supabase/server";
import { UsuariosAdmin } from "@/components/admin/UsuariosAdmin";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const supabase = await createSupabaseServer();
  const [{ data: especialistas }, { data: categorias }, { data: { user } }] =
    await Promise.all([
      supabase
        .from("jurema_especialistas")
        .select("user_id, nome, especialidade, role, ativo")
        .order("nome"),
      supabase
        .from("jurema_especialidades")
        .select("codigo, rotulo, ordem, ativo")
        .order("ordem")
        .order("rotulo"),
      supabase.auth.getUser(),
    ]);

  return (
    <UsuariosAdmin
      currentUserId={user?.id ?? ""}
      especialistas={especialistas ?? []}
      categorias={(categorias ?? []).filter((c) => c.ativo)}
    />
  );
}
