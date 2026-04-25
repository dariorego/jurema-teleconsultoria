import { createSupabaseServer } from "@/lib/supabase/server";
import { CategoriasAdmin } from "@/components/admin/CategoriasAdmin";

export const dynamic = "force-dynamic";

export default async function AdminCategoriasPage() {
  const supabase = await createSupabaseServer();
  const { data: categorias } = await supabase
    .from("jurema_especialidades")
    .select("codigo, rotulo, ordem, ativo")
    .order("ordem")
    .order("rotulo");

  return <CategoriasAdmin initial={categorias ?? []} />;
}
