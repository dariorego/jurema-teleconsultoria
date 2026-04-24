import { MessageSquare, Clock, Users, Zap } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { KpiCard, type Kpi } from "@/components/dashboard/KpiCard";
import { Panel } from "@/components/dashboard/Panel";
import { CategoryChart, type CategoryRow } from "@/components/dashboard/CategoryChart";
import { HoursChart, type HourBucket } from "@/components/dashboard/HoursChart";
import { DashboardTopBar } from "@/components/dashboard/TopBar";

export const dynamic = "force-dynamic";

const HOURS_RANGE = Array.from({ length: 12 }, (_, i) => i + 8); // 08h..19h

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default async function Dashboard() {
  const supabase = await createSupabaseServer();

  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const elevenDaysAgo = new Date(todayStart);
  elevenDaysAgo.setDate(elevenDaysAgo.getDate() - 10);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    { count: abertas },
    { count: emFila },
    { count: emAtendimento },
    { data: recentConversas },
    { data: solicitacoes },
    { data: encerradas },
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
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("jurema_conversas")
      .select("created_at, encerrada_at")
      .eq("status", "encerrada")
      .not("encerrada_at", "is", null)
      .gte("encerrada_at", sevenDaysAgo.toISOString()),
  ]);

  // Sparkline: conversations created per day over last 11 days (today inclusive).
  const perDay = new Array(11).fill(0) as number[];
  (recentConversas ?? []).forEach((r) => {
    const d = new Date(r.created_at);
    const diffDays = Math.floor((todayStart.getTime() - startOfDay(d).getTime()) / 86400000);
    const idx = 10 - diffDays; // rightmost = today
    if (idx >= 0 && idx < 11) perDay[idx] += 1;
  });

  // Today's hourly buckets for the hour chart.
  const hoursMap = new Map<number, number>(HOURS_RANGE.map((h) => [h, 0]));
  (recentConversas ?? []).forEach((r) => {
    const d = new Date(r.created_at);
    if (d >= todayStart) {
      const h = d.getHours();
      if (hoursMap.has(h)) hoursMap.set(h, (hoursMap.get(h) ?? 0) + 1);
    }
  });
  const hours: HourBucket[] = HOURS_RANGE.map((h) => ({
    h: `${h.toString().padStart(2, "0")}h`,
    v: hoursMap.get(h) ?? 0,
  }));

  // Delta vs yesterday: conversations created today vs yesterday.
  const createdToday = (recentConversas ?? []).filter(
    (r) => new Date(r.created_at) >= todayStart,
  ).length;
  const createdYesterday = (recentConversas ?? []).filter((r) => {
    const d = new Date(r.created_at);
    return d >= yesterdayStart && d < todayStart;
  }).length;
  const deltaAbertas = createdToday - createdYesterday;

  // Category chart: group solicitacoes (last 7d) by especialidade,
  // acute = pendente + em_andamento, followup = concluido.
  const catMap = new Map<string, { total: number; acute: number; followup: number }>();
  (solicitacoes ?? []).forEach((s) => {
    const key = s.especialidade ?? "—";
    const c = catMap.get(key) ?? { total: 0, acute: 0, followup: 0 };
    c.total += 1;
    if (s.status === "concluido") c.followup += 1;
    else if (s.status === "pendente" || s.status === "em_andamento") c.acute += 1;
    catMap.set(key, c);
  });
  const categories: CategoryRow[] = Array.from(catMap.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.total - a.total);

  // Average service time over last 7 days.
  const durations = (encerradas ?? [])
    .map((r) => new Date(r.encerrada_at!).getTime() - new Date(r.created_at).getTime())
    .filter((n) => n > 0);
  const avgMs = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  const peakHour = hours.reduce((p, c) => (c.v > p.v ? c : p), hours[0]);
  const peakLabel = peakHour.v > 0 ? `Hoje · pico às ${peakHour.h}` : "Hoje · sem movimento";

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
        }}
      >
        <Panel
          title="Solicitações por categoria"
          subtitle="Últimos 7 dias · distribuição por especialidade"
          right={
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--d-text-3)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: "var(--d-accent)",
                  }}
                />
                Agudo
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: "var(--d-accent)",
                    opacity: 0.45,
                  }}
                />
                Retorno
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
