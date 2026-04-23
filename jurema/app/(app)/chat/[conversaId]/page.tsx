import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ChatWindow } from "./ChatWindow";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversaId: string }>;
}) {
  const { conversaId } = await params;
  const supabase = await createSupabaseServer();

  const { data: conversa } = await supabase
    .from("jurema_conversas")
    .select(`
      id, status, especialidade, especialista_id, janela_expira_at,
      paciente:jurema_pacientes(id, wa_id, primeiro_nome, ultimo_nome, cpf, hospital)
    `)
    .eq("id", conversaId)
    .maybeSingle();

  if (!conversa) notFound();

  const { data: mensagens } = await supabase
    .from("jurema_mensagens")
    .select("*")
    .eq("conversa_id", conversaId)
    .order("created_at", { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ChatWindow
      conversa={conversa as any}
      initialMensagens={mensagens ?? []}
      userId={user!.id}
    />
  );
}
