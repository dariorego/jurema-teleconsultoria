import Link from "next/link";
import { Download } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { BASE_PATH } from "@/lib/basePath";

export default async function AjudaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  // Especialista comum só vê o manual deste papel; admin vê abas para
  // alternar entre os dois manuais.
  let isAdmin = false;
  if (user) {
    const { data: perfil } = await supabase
      .from("jurema_especialistas")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = perfil?.role === "admin";
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold text-whatsapp-text">Ajuda</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <nav
              className="flex gap-1 text-sm"
              aria-label="Selecionar manual"
            >
              <Link
                href={"/ajuda" as never}
                className="px-3 py-1.5 rounded text-whatsapp-muted hover:text-whatsapp-text hover:bg-whatsapp-panel2"
              >
                Especialista
              </Link>
              <Link
                href={"/ajuda/admin" as never}
                className="px-3 py-1.5 rounded text-whatsapp-muted hover:text-whatsapp-text hover:bg-whatsapp-panel2"
              >
                Admin
              </Link>
            </nav>
          )}
          <a
            href={`${BASE_PATH}/docs/manual.pdf`}
            download
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-whatsapp-muted hover:text-whatsapp-text border border-whatsapp-border hover:bg-whatsapp-panel2"
            title="Baixar versão completa em PDF"
          >
            <Download size={14} />
            Baixar PDF
          </a>
        </div>
      </div>
      <div className="bg-whatsapp-panel border border-whatsapp-border rounded-lg p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
