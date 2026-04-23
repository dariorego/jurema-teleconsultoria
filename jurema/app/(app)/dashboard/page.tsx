import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createSupabaseServer();

  const [{ count: abertas }, { count: emFila }, { count: emAtendimento }, { data: porEsp }] =
    await Promise.all([
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
      supabase.from("jurema_solicitacoes").select("especialidade, modalidade"),
    ]);

  const agrupado: Record<string, number> = {};
  (porEsp ?? []).forEach((r: any) => {
    agrupado[r.especialidade] = (agrupado[r.especialidade] ?? 0) + 1;
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl text-whatsapp-text">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card titulo="Conversas abertas" valor={abertas ?? 0} />
        <Card titulo="Em fila" valor={emFila ?? 0} />
        <Card titulo="Em atendimento" valor={emAtendimento ?? 0} />
      </div>

      <section>
        <h2 className="text-sm uppercase text-whatsapp-muted mb-3">
          Solicitações por especialidade
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(agrupado).map(([esp, n]) => (
            <Card key={esp} titulo={esp} valor={n} />
          ))}
          {Object.keys(agrupado).length === 0 && (
            <p className="text-sm text-whatsapp-muted italic">Nenhuma solicitação ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="p-4 rounded-lg bg-whatsapp-panel border border-whatsapp-border">
      <div className="text-xs uppercase text-whatsapp-muted">{titulo}</div>
      <div className="text-3xl font-semibold text-whatsapp-text mt-1">{valor}</div>
    </div>
  );
}
