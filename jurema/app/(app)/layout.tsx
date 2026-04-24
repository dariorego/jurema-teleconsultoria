import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidebarNav } from "@/components/SidebarNav";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("jurema_especialistas")
    .select("nome, especialidade, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const sidebar = (
    <>
      <div className="p-4 border-b border-whatsapp-border">
        <div className="flex items-center gap-2">
          <Image src="/img/logoImip.png" alt="IMIP" width={28} height={28} priority className="h-7 w-auto" />
          <div className="text-lg font-semibold text-whatsapp-text">JUREMA</div>
        </div>
        <div className="text-xs text-whatsapp-muted mt-2 space-y-0.5">
          <div className="text-whatsapp-text truncate">{perfil?.nome ?? user.email}</div>
          {perfil?.especialidade && (
            <div>
              Categoria: <span className="capitalize">{perfil.especialidade}</span>
            </div>
          )}
          {perfil?.role === "admin" && (
            <div className="inline-block px-1.5 py-0.5 rounded bg-whatsapp-accent/15 text-whatsapp-accent">
              Admin
            </div>
          )}
        </div>
      </div>
      <SidebarNav />
      <div className="p-2 border-t border-whatsapp-border space-y-1">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </>
  );

  return <AppShell sidebar={sidebar}>{children}</AppShell>;
}
