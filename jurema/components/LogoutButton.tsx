"use client";
import { useRouter } from "next/navigation";
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
      onClick={logout}
      className="w-full text-left px-3 py-2 rounded hover:bg-whatsapp-panel2 text-whatsapp-muted text-sm"
    >
      Sair
    </button>
  );
}
