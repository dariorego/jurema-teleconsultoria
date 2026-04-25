import { MessageSquare, Clock, Users, Zap } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { BASE_PATH } from "@/lib/basePath";
import { KpiCard, type Kpi } from "@/components/dashboard/KpiCard";
import { Panel } from "@/components/dashboard/Panel";
import { CategoryChart, type CategoryRow } from "@/components/dashboard/CategoryChart";
import { HoursChart, type HourBucket } from "@/components/dashboard/HoursChart";
import { DashboardTopBar } from "@/components/dashboard/TopBar";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import {
  AtendimentosTable,
  type AtendimentoRow,
} from "@/components/dashboard/AtendimentosTable";

export const dynamic = "force-dynamic";

const HOURS_RANGE = Array.from({ length: 12 }, (_, i) => i + 8); // 08h..19h

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

type Status = "fila" | "em_atendimento" | "aguardando_avaliacao" | "encerrada";

const PER_PAGE_DEFAULT = 15;
const PER_PAGE_ALLOWED = [15, 20, 50, 100];

function parsePer(raw: string | undefined): number {
  const n = parseInt(raw ?? "", 10);
  return PER_PAGE_ALLOWED.includes(n) ? n : PER_PAGE_DEFAULT;
}
function parsePage(raw: string | undefined): number {
  const n = parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    cats?: string;
    fp?: string;
    fn?: string;
    ap?: string;
    an?: string;
    xp?: string;
    xn?: string;
  }>;
}) {
  const supabase = await createSupabaseServer();
  const sp = await searchParams;
  const periodDays = Math.max(1, Math.min(365, parseInt(sp.period ?? "7", 10) || 7));
  const cats = (sp.cats ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const filaPage = parsePage(sp.fp);
  const filaPer = parsePer(sp.fn);
  const ematPage = parsePage(sp.ap);
  const ematPer = parsePer(sp.an);
  const finPage = parsePage(sp.xp);
  const finPer = parsePer(sp.xn);

  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const elevenDaysAgo = new Date(todayStart);
  elevenDaysAgo.setDate(elevenDaysAgo.getDate() - 10);
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - periodDays);

  // Helper inline para construir queries de listagem de cada status,
  // aplicando filtro de categoria e paginação por offset.
  const baseSelect = `id, especialidade, created_at, encerrada_at,
    paciente:jurema_pacientes(primeiro_nome, ultimo_nome, wa_id)`;
  function buildListQuery(
    status: "fila" | "em_atendimento" | "encerrada",
    page: number,
    per: number,
    orderCol: "created_at" | "encerrada_at",
  ) {
    let q = supabase
      .from("jurema_conversas")
      .select(baseSelect, { count: "exact" })
      .eq("status", status);
    if (orderCol === "encerrada_at") q = q.not("encerrada_at", "is", null);
    if (cats.length > 0) q = q.in("especialidade", cats);
    const from = (page - 1) * per;
    const to = from + per - 1;
    return q.order(orderCol, { ascending: true }).range(from, to);
  }

  const [
    { count: abertas },
    { count: emFila },
    { count: emAtendimento },
    { data: recentConversas },
    { data: solicitacoes },
    { data: encerradas },
    { data: filaList, count: filaCount },
    { data: ematList, count: ematCount },
    { data: finList, count: finCount },
    { data: categoriasAtivas },
  ] = await Promise.all([
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
      .select("id, created_at, especialidade, status")
      .gte("created_at", elevenDaysAgo.toISOString()),
    supabase
      .from("jurema_solicitacoes")
      .select("especialidade, status, created_at")
      .gte("created_at", periodStart.toISOString()),
    supabase
      .from("jurema_conversas")
      .select("created_at, encerrada_at")
      .eq("status", "encerrada")
      .not("encerrada_at", "is", null)
      .gte("encerrada_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    buildListQuery("fila", filaPage, filaPer, "created_at"),
    buildListQuery("em_atendimento", ematPage, ematPer, "created_at"),
    buildListQuery("encerrada", finPage, finPer, "encerrada_at"),
    supabase
      .from("jurema_especialidades")
      .select("codigo, rotulo, ordem, ativo")
      .eq("ativo", true)
      .order("ordem")
      .order("rotulo"),
  ]);

  const filterCats = (codigo: string | null | undefined) =>
    cats.length === 0 || (codigo != null && cats.includes(codigo));

  // Sparkline KPI: últimos 11 dias de conversas criadas (ignora cats — KPI global)
  const perDay = new Array(11).fill(0) as number[];
  (recentConversas ?? []).forEach((r) => {
    const d = new Date(r.created_at);
    const diffDays = Math.floor((todayStart.getTime() - startOfDay(d).getTime()) / 86400000);
    const idx = 10 - diffDays;
    if (idx >= 0 && idx < 11) perDay[idx] += 1;
  });

  // Volume por hora: 3 séries por status atual, agrupadas pela hora de criação (hoje).
  const hoursMap = new Map<number, HourBucket>(
    HOURS_RANGE.map((h) => [h, { h: `${h.toString().padStart(2, "0")}h`, aberto: 0, emAtendimento: 0, fechado: 0 }]),
  );
  (recentConversas ?? []).forEach((r) => {
    const d = new Date(r.created_at);
    if (d < todayStart) return;
    if (!filterCats(r.especialidade)) return;
    const h = d.getHours();
    const bucket = hoursMap.get(h);
    if (!bucket) return;
    const status = r.status as Status;
    if (status === "fila") bucket.aberto += 1;
    else if (status === "em_atendimento" || status === "aguardando_avaliacao")
      bucket.emAtendimento += 1;
    else if (status === "encerrada") bucket.fechado += 1;
  });
  const hours: HourBucket[] = HOURS_RANGE.map((h) => hoursMap.get(h)!);

  // Delta vs ontem (KPI Conversas abertas).
  const createdToday = (recentConversas ?? []).filter(
    (r) => new Date(r.created_at) >= todayStart,
  ).length;
  const createdYesterday = (recentConversas ?? []).filter((r) => {
    const d = new Date(r.created_at);
    return d >= yesterdayStart && d < todayStart;
  }).length;
  const deltaAbertas = createdToday - createdYesterday;

  // Categoria: total no período + em aberto (pendente + em_andamento).
  const catMap = new Map<string, { total: number; emAberto: number }>();
  (solicitacoes ?? []).forEach((s) => {
    if (!filterCats(s.especialidade)) return;
    const key = s.especialidade ?? "—";
    const c = catMap.get(key) ?? { total: 0, emAberto: 0 };
    c.total += 1;
    if (s.status === "pendente" || s.status === "em_andamento") c.emAberto += 1;
    catMap.set(key, c);
  });
  const categories: CategoryRow[] = Array.from(catMap.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.total - a.total);

  // Tempo médio (últimos 7 dias).
  const durations = (encerradas ?? [])
    .map((r) => new Date(r.encerrada_at!).getTime() - new Date(r.created_at).getTime())
    .filter((n) => n > 0);
  const avgMs = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  // Linhas das 3 tabelas — normaliza paciente (array → objeto) e refTimestamp.
  type RawListRow = {
    id: string;
    especialidade: string;
    created_at: string;
    encerrada_at: string | null;
    paciente: AtendimentoRow["paciente"] | AtendimentoRow["paciente"][];
  };
  function normalizeRow(r: RawListRow, ref: "created_at" | "encerrada_at"): AtendimentoRow {
    return {
      id: r.id,
      especialidade: r.especialidade,
      refTimestamp: ref === "encerrada_at" ? r.encerrada_at ?? r.created_at : r.created_at,
      paciente: Array.isArray(r.paciente) ? (r.paciente[0] ?? null) : r.paciente,
    };
  }
  const filaRows: AtendimentoRow[] = ((filaList ?? []) as RawListRow[]).map((r) =>
    normalizeRow(r, "created_at"),
  );
  const ematRows: AtendimentoRow[] = ((ematList ?? []) as RawListRow[]).map((r) =>
    normalizeRow(r, "created_at"),
  );
  const finRows: AtendimentoRow[] = ((finList ?? []) as RawListRow[]).map((r) =>
    normalizeRow(r, "encerrada_at"),
  );

  const peakHourBucket = hours.reduce(
    (p, c) => {
      const total = c.aberto + c.emAtendimento + c.fechado;
      return total > p.total ? { h: c.h, total } : p;
    },
    { h: "", total: 0 },
  );
  const peakLabel = peakHourBucket.total > 0
    ? `Hoje · pico às ${peakHourBucket.h}`
    : "Hoje · sem movimento";

  const kpis: Kpi[] = [
    {
      id: "open",
      label: "Conversas abertas",
      value: abertas ?? 0,
      icon: MessageSquare,
      tone: "accent",
      delta: deltaAbertas,
      deltaLabel: "vs. ontem",
      spark: perDay,
    },
    {
      id: "queue",
      label: "Em fila",
      value: emFila ?? 0,
      icon: Clock,
      tone: (emFila ?? 0) > 0 ? "warn" : "ok",
      lowerIsBetter: true,
    },
    {
      id: "active",
      label: "Em atendimento",
      value: emAtendimento ?? 0,
      icon: Users,
      tone: "accent",
    },
    {
      id: "avg",
      label: "Tempo médio",
      value: formatDuration(avgMs),
      icon: Zap,
      tone: "accent",
      lowerIsBetter: true,
    },
  ];

  return (
    <div
      className="dashboard-v2"
      style={{
        background: "var(--d-bg)",
        color: "var(--d-text)",
        minHeight: "100%",
        padding: "28px 32px 40px",
      }}
    >
      <DashboardTopBar updatedLabel="atualizado agora" />

      <DashboardFilters
        categorias={(categoriasAtivas ?? []).map((c) => ({
          codigo: c.codigo,
          rotulo: c.rotulo,
        }))}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {kpis.map((k) => (
          <KpiCard key={k.id} k={k} />
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <Panel
          title="Solicitações por categoria"
          subtitle={`Últimos ${periodDays} dia(s)${cats.length ? ` · filtro: ${cats.length} categoria(s)` : ""}`}
          right={
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--d-text-3)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--d-accent)" }} />
                Em aberto
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--d-accent)", opacity: 0.45 }} />
                Total
              </span>
            </div>
          }
        >
          <CategoryChart data={categories} />
        </Panel>

        <Panel title="Volume por hora" subtitle={peakLabel}>
          <HoursChart data={hours} />
        </Panel>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <AtendimentosTable
          title="Em fila sem atendimento"
          subtitle={
            (filaCount ?? 0) === 0
              ? "Nenhuma conversa aguardando"
              : `${filaCount} conversa(s) — mais antigas primeiro`
          }
          rows={filaRows}
          total={filaCount ?? 0}
          page={filaPage}
          perPage={filaPer}
          paramPrefix="f"
          tempoLabel="Aberta há"
          tempoTone="warn"
          basePath={BASE_PATH}
        />
        <AtendimentosTable
          title="Em atendimento"
          subtitle={
            (ematCount ?? 0) === 0
              ? "Nenhuma conversa em atendimento"
              : `${ematCount} conversa(s) — mais antigas primeiro`
          }
          rows={ematRows}
          total={ematCount ?? 0}
          page={ematPage}
          perPage={ematPer}
          paramPrefix="a"
          tempoLabel="Em atendimento há"
          tempoTone="accent"
          basePath={BASE_PATH}
        />
        <AtendimentosTable
          title="Finalizados"
          subtitle={
            (finCount ?? 0) === 0
              ? "Nenhuma conversa finalizada"
              : `${finCount} conversa(s) — mais antigas primeiro`
          }
          rows={finRows}
          total={finCount ?? 0}
          page={finPage}
          perPage={finPer}
          paramPrefix="x"
          tempoLabel="Finalizada há"
          tempoTone="muted"
          basePath={BASE_PATH}
        />
      </div>

      <div
        style={{
          fontSize: 11,
          color: "var(--d-text-3)",
          marginTop: 24,
          textAlign: "center",
        }}
      >
        Jurema · Teleconsultoria
      </div>
    </div>
  );
}
