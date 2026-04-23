import { createSupabaseServer } from "@/lib/supabase/server";
import { CaixaLive } from "./CaixaLive";

export const dynamic = "force-dynamic";

export default async function CaixaPage() {
  const supabase = await createSupabaseServer();

  // RLS já filtra por especialidade; aqui trazemos fila + em_atendimento.
  const { data: conversas } = await supabase
    .from("jurema_conversas")
    .select(`
      id, status, especialidade, especialista_id, ultima_mensagem_at, ultima_inbound_at, created_at,
      paciente:jurema_pacientes(id, wa_id, primeiro_nome, ultimo_nome, hospital)
    `)
    .in("status", ["fila", "em_atendimento"])
    .order("ultima_inbound_at", { ascending: false, nullsFirst: false });

  const { data: { user } } = await supabase.auth.getUser();

  return <CaixaLive initial={conversas ?? []} userId={user?.id ?? ""} />;
}
