import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ManualAdmin } from "@/components/help/ManualAdmin";

export const dynamic = "force-dynamic";

export default async function AjudaAdminPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("jurema_especialistas")
    .select("role, ativo")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!perfil?.ativo || perfil.role !== "admin") {
    redirect("/ajuda");
  }

  return <ManualAdmin />;
}
