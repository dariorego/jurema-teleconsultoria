"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/PasswordInput";

const MIN_LEN = 8;

export function AlterarSenhaForm() {
  const supabase = createSupabaseBrowser();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    if (novaSenha.length < MIN_LEN) {
      setErro(`A nova senha deve ter pelo menos ${MIN_LEN} caracteres.`);
      return;
    }
    if (novaSenha !== confirma) {
      setErro("As duas senhas não conferem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setLoading(false);

    if (error) {
      setErro(error.message);
      return;
    }
    setSucesso(true);
    setNovaSenha("");
    setConfirma("");
  }

  return (
    <form onSubmit={submit} className="space-y-4" aria-label="Trocar senha">
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-whatsapp-muted block">
          Nova senha
        </label>
        <PasswordInput
          required
          autoComplete="new-password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          aria-invalid={!!erro}
          aria-describedby={erro ? "senha-error" : undefined}
        />
        <p className="text-[11px] text-whatsapp-muted">
          Mínimo {MIN_LEN} caracteres. Use uma combinação de letras, números e símbolos.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-whatsapp-muted block">
          Confirmar nova senha
        </label>
        <PasswordInput
          required
          autoComplete="new-password"
          value={confirma}
          onChange={(e) => setConfirma(e.target.value)}
        />
      </div>

      {erro && (
        <div
          id="senha-error"
          role="alert"
          className="flex items-start gap-2 p-3 rounded-lg text-sm"
          style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div
          role="status"
          className="flex items-start gap-2 p-3 rounded-lg text-sm"
          style={{ background: "rgba(0,168,132,0.12)", color: "var(--color-accent)" }}
        >
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>Senha atualizada com sucesso.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !novaSenha || !confirma}
        className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-whatsapp-accent text-white font-medium tracking-wide transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Salvando…" : "Trocar senha"}
      </button>
    </form>
  );
}
