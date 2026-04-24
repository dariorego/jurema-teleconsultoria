"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/PasswordInput";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErro(error.message);
    router.push("/caixa");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-whatsapp-bg p-4">
      <div className="fixed top-3 right-3 w-auto">
        <div className="w-40">
          <ThemeToggle />
        </div>
      </div>

      <form
        onSubmit={entrar}
        aria-label="Formulário de login"
        className="w-full max-w-sm p-8 rounded-2xl bg-whatsapp-panel border border-whatsapp-border space-y-5 shadow-sm"
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-whatsapp-text">JUREMA</h1>
          <p className="text-sm text-whatsapp-muted">Teleconsultoria IMIP</p>
        </div>

        <label className="block space-y-1">
          <span className="text-sm text-whatsapp-muted">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text placeholder:text-whatsapp-muted focus:outline-none focus:border-whatsapp-accent"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-whatsapp-muted">Senha</span>
          <PasswordInput
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!erro}
            aria-describedby={erro ? "login-error" : undefined}
          />
        </label>

        {erro && (
          <div
            id="login-error"
            role="alert"
            className="flex items-start gap-2 p-3 rounded-lg text-sm"
            style={{
              background: "var(--color-danger-bg)",
              color: "var(--color-danger)",
            }}
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-whatsapp-accent text-white font-medium transition hover:bg-[var(--color-accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
