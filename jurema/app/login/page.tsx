"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

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
    <div className="min-h-screen flex items-center justify-center bg-whatsapp-bg">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm p-8 rounded-2xl bg-whatsapp-panel border border-whatsapp-border space-y-4"
      >
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-whatsapp-text">JUREMA</h1>
          <p className="text-sm text-whatsapp-muted">Teleconsultoria IMIP</p>
        </div>

        <label className="block">
          <span className="text-sm text-whatsapp-muted">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text focus:outline-none focus:border-whatsapp-accent"
          />
        </label>

        <label className="block">
          <span className="text-sm text-whatsapp-muted">Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text focus:outline-none focus:border-whatsapp-accent"
          />
        </label>

        {erro && <p className="text-sm text-red-400">{erro}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-whatsapp-accent text-white font-medium disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
