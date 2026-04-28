"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { apiUrl } from "@/lib/basePath";

type Especialista = {
  user_id: string;
  nome: string;
  especialidade: string | null;
  role: "especialista" | "admin";
  ativo: boolean;
};

type Categoria = {
  codigo: string;
  rotulo: string;
};

type FormState = {
  mode: "create" | "edit";
  user_id?: string;
  email: string;
  nome: string;
  especialidade: string;
  role: "especialista" | "admin";
};

const EMPTY_FORM: FormState = {
  mode: "create",
  email: "",
  nome: "",
  especialidade: "",
  role: "especialista",
};

export function UsuariosAdmin({
  currentUserId,
  especialistas,
  categorias,
}: {
  currentUserId: string;
  especialistas: Especialista[];
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function abrirCriar() {
    setForm(EMPTY_FORM);
    setErro(null);
    setFormOpen(true);
  }

  function abrirEditar(e: Especialista) {
    setForm({
      mode: "edit",
      user_id: e.user_id,
      email: "",
      nome: e.nome,
      especialidade: e.especialidade ?? "",
      role: e.role,
    });
    setErro(null);
    setFormOpen(true);
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setErro(null);
    if (form.mode === "create") {
      if (!form.email.trim() || !form.nome.trim()) {
        setErro("Email e nome são obrigatórios");
        return;
      }
      const res = await fetch(apiUrl("/api/admin/usuarios"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          nome: form.nome.trim(),
          especialidade: form.especialidade || null,
          role: form.role,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(`Erro: ${j.error}${j.detail ? ` — ${j.detail}` : ""}`);
        return;
      }
      if (j.message) alert(j.message);
    } else {
      const res = await fetch(apiUrl(`/api/admin/usuarios/${form.user_id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          especialidade: form.especialidade || null,
          role: form.role,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErro(`Erro: ${j.error}${j.detail ? ` — ${j.detail}` : ""}`);
        return;
      }
    }
    setFormOpen(false);
    start(() => router.refresh());
  }

  async function reenviarConvite(e: Especialista) {
    const res = await fetch(apiUrl(`/api/admin/usuarios/${e.user_id}/reenviar`), {
      method: "POST",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(`Erro: ${j.error}${j.detail ? ` — ${j.detail}` : ""}`);
      return;
    }
    let msg = j.message ?? "Link gerado.";
    if (j.action_link) {
      // SMTP pode não estar configurado; oferece o link pra cópia manual.
      msg += `\n\nLink:\n${j.action_link}\n\n(Já copiado para a área de transferência)`;
      try {
        await navigator.clipboard.writeText(j.action_link);
      } catch {
        /* fallback: usuário copia manualmente */
      }
    }
    alert(msg);
  }

  async function toggleAtivo(e: Especialista) {
    if (e.user_id === currentUserId && e.ativo) {
      alert("Você não pode desativar a si mesmo.");
      return;
    }
    const res = await fetch(apiUrl(`/api/admin/usuarios/${e.user_id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !e.ativo }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Erro: ${j.error}`);
      return;
    }
    start(() => router.refresh());
  }

  const cats = new Map(categorias.map((c) => [c.codigo, c.rotulo]));

  return (
    <section className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-whatsapp-muted">{especialistas.length} usuário(s)</p>
        <button
          type="button"
          onClick={abrirCriar}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm bg-whatsapp-accent text-white font-medium hover:opacity-90"
        >
          <Plus size={16} />
          Novo usuário
        </button>
      </div>

      <div className="border border-whatsapp-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-whatsapp-panel text-whatsapp-muted">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Nome</th>
              <th className="text-left px-3 py-2 font-medium">Categoria</th>
              <th className="text-left px-3 py-2 font-medium">Role</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              <th className="text-right px-3 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {especialistas.map((e) => (
              <tr key={e.user_id} className="border-t border-whatsapp-border">
                <td className="px-3 py-2 text-whatsapp-text">{e.nome}</td>
                <td className="px-3 py-2 text-whatsapp-muted capitalize">
                  {e.especialidade ? cats.get(e.especialidade) ?? e.especialidade : "—"}
                </td>
                <td className="px-3 py-2 text-whatsapp-muted capitalize">{e.role}</td>
                <td className="px-3 py-2">
                  {e.ativo ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-whatsapp-accent/15 text-whatsapp-accent">
                      Ativo
                    </span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-whatsapp-panel2 text-whatsapp-muted">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => abrirEditar(e)}
                    className="text-xs px-2 py-1 rounded border border-whatsapp-border text-whatsapp-text hover:bg-whatsapp-panel2"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => reenviarConvite(e)}
                    title="Gera novo link de definição de senha e envia por email"
                    className="text-xs px-2 py-1 rounded border border-whatsapp-border text-whatsapp-muted hover:text-whatsapp-text hover:bg-whatsapp-panel2"
                  >
                    Reenviar convite
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAtivo(e)}
                    disabled={e.user_id === currentUserId && e.ativo}
                    className="text-xs px-2 py-1 rounded border border-whatsapp-border text-whatsapp-muted hover:text-whatsapp-text hover:bg-whatsapp-panel2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {e.ativo ? "Desativar" : "Reativar"}
                  </button>
                </td>
              </tr>
            ))}
            {especialistas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-whatsapp-muted italic">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setFormOpen(false)}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-5 rounded-lg bg-whatsapp-panel border border-whatsapp-border space-y-3"
            aria-label={form.mode === "create" ? "Criar novo usuário" : "Editar usuário"}
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-whatsapp-text">
                {form.mode === "create" ? "Novo usuário" : "Editar usuário"}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Fechar"
                className="text-whatsapp-muted hover:text-whatsapp-text"
              >
                <X size={18} />
              </button>
            </div>

            {form.mode === "create" && (
              <label className="block">
                <span className="text-xs text-whatsapp-muted">Email</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text text-sm focus:outline-none focus:border-whatsapp-accent"
                />
                <span className="text-[11px] text-whatsapp-muted">
                  Receberá um convite por email com link para definir a senha.
                </span>
              </label>
            )}

            <label className="block">
              <span className="text-xs text-whatsapp-muted">Nome</span>
              <input
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text text-sm focus:outline-none focus:border-whatsapp-accent"
              />
            </label>

            <label className="block">
              <span className="text-xs text-whatsapp-muted">Categoria</span>
              <select
                value={form.especialidade}
                onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text text-sm focus:outline-none focus:border-whatsapp-accent"
              >
                <option value="">— sem categoria (admin) —</option>
                {categorias.map((c) => (
                  <option key={c.codigo} value={c.codigo}>
                    {c.rotulo}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-whatsapp-muted">Role</span>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as "especialista" | "admin" })
                }
                disabled={form.mode === "edit" && form.user_id === currentUserId}
                className="mt-1 w-full px-3 py-2 rounded bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text text-sm focus:outline-none focus:border-whatsapp-accent disabled:opacity-50"
              >
                <option value="especialista">Especialista</option>
                <option value="admin">Admin</option>
              </select>
              {form.mode === "edit" && form.user_id === currentUserId && (
                <span className="text-[11px] text-whatsapp-muted">
                  Não é possível alterar o próprio role.
                </span>
              )}
            </label>

            {erro && <p className="text-sm text-red-400">{erro}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-3 py-1.5 rounded border border-whatsapp-border text-whatsapp-muted hover:text-whatsapp-text"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="px-3 py-1.5 rounded bg-whatsapp-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Salvando…" : form.mode === "create" ? "Convidar" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
