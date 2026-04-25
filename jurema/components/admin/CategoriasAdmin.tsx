"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { apiUrl } from "@/lib/basePath";

type Categoria = {
  codigo: string;
  rotulo: string;
  ordem: number;
  ativo: boolean;
};

export function CategoriasAdmin({ initial }: { initial: Categoria[] }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [rotulo, setRotulo] = useState("");
  const [ordem, setOrdem] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function criar(ev: React.FormEvent) {
    ev.preventDefault();
    setErro(null);
    const res = await fetch(apiUrl("/api/admin/categorias"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, rotulo, ordem }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErro(`Erro: ${j.error}${j.detail ? ` — ${j.detail}` : ""}`);
      return;
    }
    setCodigo("");
    setRotulo("");
    setOrdem(0);
    start(() => router.refresh());
  }

  async function patch(c: Categoria, body: Partial<Categoria>) {
    const res = await fetch(apiUrl(`/api/admin/categorias/${c.codigo}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Erro: ${j.error}`);
      return;
    }
    start(() => router.refresh());
  }

  return (
    <section className="space-y-4">
      <form
        onSubmit={criar}
        className="flex flex-wrap items-end gap-3 p-3 rounded-lg border border-whatsapp-border bg-whatsapp-panel"
      >
        <label className="flex flex-col gap-1 text-xs text-whatsapp-muted">
          <span>Código (sem espaços)</span>
          <input
            required
            pattern="[a-z][a-z0-9_]{1,31}"
            placeholder="ex: pediatria"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toLowerCase())}
            className="px-2 py-1.5 rounded bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text text-sm focus:outline-none focus:border-whatsapp-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-whatsapp-muted">
          <span>Rótulo</span>
          <input
            required
            placeholder="ex: Pediatria"
            value={rotulo}
            onChange={(e) => setRotulo(e.target.value)}
            className="px-2 py-1.5 rounded bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text text-sm focus:outline-none focus:border-whatsapp-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-whatsapp-muted">
          <span>Ordem</span>
          <input
            type="number"
            value={ordem}
            onChange={(e) => setOrdem(Number(e.target.value))}
            className="w-20 px-2 py-1.5 rounded bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text text-sm focus:outline-none focus:border-whatsapp-accent"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm bg-whatsapp-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={16} />
          Adicionar
        </button>
        {erro && <p className="text-sm text-red-400 w-full">{erro}</p>}
      </form>

      <div className="border border-whatsapp-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-whatsapp-panel text-whatsapp-muted">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Código</th>
              <th className="text-left px-3 py-2 font-medium">Rótulo</th>
              <th className="text-left px-3 py-2 font-medium">Ordem</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              <th className="text-right px-3 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {initial.map((c) => (
              <tr key={c.codigo} className="border-t border-whatsapp-border">
                <td className="px-3 py-2 font-mono text-xs text-whatsapp-muted">{c.codigo}</td>
                <td className="px-3 py-2 text-whatsapp-text">
                  <input
                    defaultValue={c.rotulo}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== c.rotulo) patch(c, { rotulo: v });
                    }}
                    className="px-2 py-1 rounded bg-transparent border border-transparent hover:border-whatsapp-border focus:border-whatsapp-accent focus:bg-whatsapp-panel2 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    defaultValue={c.ordem}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v !== c.ordem) patch(c, { ordem: v });
                    }}
                    className="w-16 px-2 py-1 rounded bg-transparent border border-transparent hover:border-whatsapp-border focus:border-whatsapp-accent focus:bg-whatsapp-panel2 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  {c.ativo ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-whatsapp-accent/15 text-whatsapp-accent">
                      Ativa
                    </span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-whatsapp-panel2 text-whatsapp-muted">
                      Inativa
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => patch(c, { ativo: !c.ativo })}
                    className="text-xs px-2 py-1 rounded border border-whatsapp-border text-whatsapp-muted hover:text-whatsapp-text hover:bg-whatsapp-panel2"
                  >
                    {c.ativo ? "Desativar" : "Reativar"}
                  </button>
                </td>
              </tr>
            ))}
            {initial.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-whatsapp-muted italic">
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
