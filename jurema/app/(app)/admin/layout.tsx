import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("jurema_especialistas")
    .select("role, ativo")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!perfil?.ativo || perfil.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold text-whatsapp-text">Administração</h1>
        <nav className="flex gap-1 text-sm" aria-label="Seções de admin">
          <Link
            href={"/admin/usuarios" as never}
            className="px-3 py-1.5 rounded text-whatsapp-muted hover:text-whatsapp-text hover:bg-whatsapp-panel2"
          >
            Usuários
          </Link>
          <Link
            href={"/admin/categorias" as never}
            className="px-3 py-1.5 rounded text-whatsapp-muted hover:text-whatsapp-text hover:bg-whatsapp-panel2"
          >
            Categorias
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
