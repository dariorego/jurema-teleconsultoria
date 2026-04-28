import { createSupabaseServer } from "@/lib/supabase/server";
import {
  AguardandoLinkAdmin,
  type SolicitacaoLink,
} from "@/components/admin/AguardandoLinkAdmin";

export const dynamic = "force-dynamic";

type SolicitacaoRow = {
  id: string;
  especialidade: string;
  observacoes: string | null;
  created_at: string;
  paciente:
    | {
        primeiro_nome: string;
        ultimo_nome: string | null;
        wa_id: string;
        hospital: string | null;
      }
    | Array<{
        primeiro_nome: string;
        ultimo_nome: string | null;
        wa_id: string;
        hospital: string | null;
      }>
    | null;
};

export default async function AdminAguardandoLinkPage() {
  const supabase = await createSupabaseServer();

  const [{ data: solicitacoes }, { data: categorias }] = await Promise.all([
    supabase
      .from("jurema_solicitacoes")
      .select(`
        id, especialidade, observacoes, created_at,
        paciente:jurema_pacientes(primeiro_nome, ultimo_nome, wa_id, hospital)
      `)
      .eq("modalidade", "teleatendimento")
      .eq("status", "pendente")
      .order("created_at", { ascending: true }),
    supabase
      .from("jurema_especialidades")
      .select("codigo, rotulo"),
  ]);

  const cats = new Map((categorias ?? []).map((c) => [c.codigo, c.rotulo]));

  const initial: SolicitacaoLink[] = ((solicitacoes ?? []) as SolicitacaoRow[]).map((s) => {
    const paciente = Array.isArray(s.paciente) ? s.paciente[0] ?? null : s.paciente;
    return {
      id: s.id,
      especialidade_codigo: s.especialidade,
      especialidade_rotulo: cats.get(s.especialidade) ?? s.especialidade,
      observacoes: s.observacoes,
      created_at: s.created_at,
      paciente: paciente ?? null,
    };
  });

  return <AguardandoLinkAdmin initial={initial} />;
}
