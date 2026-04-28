import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AlterarSenhaForm } from "@/components/perfil/AlterarSenhaForm";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: perfil }, { data: categoria }] = await Promise.all([
    supabase
      .from("jurema_especialistas")
      .select("nome, especialidade, role, ativo")
      .eq("user_id", user.id)
      .maybeSingle(),
    // Para mostrar o rótulo amigável da categoria (ex: "Médico" em vez de "medico").
    supabase
      .from("jurema_especialidades")
      .select("codigo, rotulo")
      .order("ordem"),
  ]);

  const cats = new Map((categoria ?? []).map((c) => [c.codigo, c.rotulo]));
  const categoriaRotulo = perfil?.especialidade
    ? cats.get(perfil.especialidade) ?? perfil.especialidade
    : null;

  const roleLabel =
    perfil?.role === "admin" ? "Admin" : perfil?.role === "especialista" ? "Especialista" : "—";

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-whatsapp-text">Perfil</h1>
          <p className="text-sm text-whatsapp-muted">Informações da sua conta e troca de senha.</p>
        </div>
      </div>

      <section className="bg-whatsapp-panel border border-whatsapp-border rounded-lg p-6 md:p-8 space-y-4">
        <h2 className="text-base font-semibold text-whatsapp-text">Informações</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Row label="Nome" value={perfil?.nome ?? "—"} />
          <Row label="Email" value={user.email ?? "—"} />
          <Row label="Categoria" value={categoriaRotulo ?? "—"} capitalize />
          <Row label="Papel" value={roleLabel} />
          <Row
            label="Status"
            value={
              perfil?.ativo ? (
                <span className="text-xs px-1.5 py-0.5 rounded bg-whatsapp-accent/15 text-whatsapp-accent">
                  Ativo
                </span>
              ) : (
                <span className="text-xs px-1.5 py-0.5 rounded bg-whatsapp-panel2 text-whatsapp-muted">
                  Inativo
                </span>
              )
            }
          />
        </dl>
        <p className="text-xs text-whatsapp-muted">
          Para alterar nome, categoria ou papel, entre em contato com um administrador.
        </p>
      </section>

      <section className="bg-whatsapp-panel border border-whatsapp-border rounded-lg p-6 md:p-8 space-y-4 max-w-xl">
        <div>
          <h2 className="text-base font-semibold text-whatsapp-text">Trocar senha</h2>
          <p className="text-sm text-whatsapp-muted">
            Defina uma nova senha. A sessão atual continuará ativa.
          </p>
        </div>
        <AlterarSenhaForm />
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wider text-whatsapp-muted">{label}</dt>
      <dd className={`text-whatsapp-text ${capitalize ? "capitalize" : ""}`}>{value}</dd>
    </div>
  );
}
