"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-whatsapp-panel2 text-whatsapp-muted hover:text-whatsapp-text text-sm"
    >
      <LogOut size={16} />
      <span>Sair</span>
    </button>
  );
}
