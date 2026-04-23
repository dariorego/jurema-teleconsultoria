import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("jurema_especialistas")
    .select("nome, especialidade, role")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="bg-whatsapp-panel border-r border-whatsapp-border flex flex-col">
        <div className="p-4 border-b border-whatsapp-border">
          <div className="text-lg font-semibold text-whatsapp-text">JUREMA</div>
          <div className="text-xs text-whatsapp-muted">
            {perfil?.nome ?? user.email}
            {perfil?.especialidade && (
              <span className="block capitalize">{perfil.especialidade}</span>
            )}
            {perfil?.role === "admin" && <span className="block">Admin</span>}
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <Link href="/caixa" className="block px-3 py-2 rounded hover:bg-whatsapp-panel2 text-whatsapp-text">
            Caixa
          </Link>
          <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-whatsapp-panel2 text-whatsapp-text">
            Dashboard
          </Link>
        </nav>
        <div className="p-2 border-t border-whatsapp-border">
          <LogoutButton />
        </div>
      </aside>
      <main className="bg-whatsapp-bg">{children}</main>
    </div>
  );
}
