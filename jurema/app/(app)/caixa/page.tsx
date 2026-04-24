import { createSupabaseServer } from "@/lib/supabase/server";
import { CaixaLive } from "./CaixaLive";
import { CaixaFilters, type EspecialistaOption } from "./CaixaFilters";
import { MiniKpiStrip } from "@/components/dashboard/MiniKpiStrip";

export const dynamic = "force-dynamic";

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default async function CaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; especialista?: string }>;
}) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("jurema_especialistas")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  const isAdmin = perfil?.role === "admin";

  const { from, to, especialista } = await searchParams;
  const fromIso = from ? new Date(`${from}T00:00:00`).toISOString() : null;
  const toIso = to ? new Date(`${to}T23:59:59.999`).toISOString() : null;
  const hasFilter = Boolean(fromIso || toIso || especialista);

  // Lista de conversas para a Caixa. Sem filtro: apenas ativas (fila+em_atend).
  // Com filtro: usa janela por created_at e inclui encerradas para busca histórica.
  let query = supabase
    .from("jurema_conversas")
    .select(`
      id, status, especialidade, especialista_id, ultima_mensagem_at, ultima_inbound_at, created_at,
      paciente:jurema_pacientes(id, wa_id, primeiro_nome, ultimo_nome, hospital)
    `)
    .order("ultima_inbound_at", { ascending: false, nullsFirst: false });

  if (hasFilter) {
    if (fromIso) query = query.gte("created_at", fromIso);
    if (toIso) query = query.lte("created_at", toIso);
    if (isAdmin && especialista) query = query.eq("especialista_id", especialista);
  } else {
    query = query.in("status", ["fila", "em_atendimento"]);
  }

  const [
    { data: conversas },
    { count: abertas },
    { count: emFila },
    { count: emAtendimento },
    { data: encerradas },
    { data: especialistas },
  ] = await Promise.all([
    query,
    supabase
      .from("jurema_conversas")
      .select("*", { count: "exact", head: true })
      .in("status", ["fila", "em_atendimento"]),
    supabase
      .from("jurema_conversas")
      .select("*", { count: "exact", head: true })
      .eq("status", "fila"),
    supabase
      .from("jurema_conversas")
      .select("*", { count: "exact", head: true })
      .eq("status", "em_atendimento"),
    supabase
      .from("jurema_conversas")
      .select("created_at, encerrada_at")
      .eq("status", "encerrada")
      .not("encerrada_at", "is", null)
      .gte("encerrada_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    isAdmin
      ? supabase
          .from("jurema_especialistas")
          .select("user_id, nome")
          .eq("ativo", true)
          .order("nome")
      : Promise.resolve({ data: [] as EspecialistaOption[] }),
  ]);

  const durations = (encerradas ?? [])
    .map((r) => new Date(r.encerrada_at!).getTime() - new Date(r.created_at).getTime())
    .filter((n) => n > 0);
  const avgMs = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <MiniKpiStrip
        abertas={abertas ?? 0}
        emFila={emFila ?? 0}
        emAtendimento={emAtendimento ?? 0}
        tempoMedio={formatDuration(avgMs)}
      />
      <CaixaFilters
        isAdmin={isAdmin}
        especialistas={(especialistas ?? []) as EspecialistaOption[]}
      />
      <CaixaLive initial={conversas ?? []} userId={user.id} />
    </div>
  );
}
