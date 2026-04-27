"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/PasswordInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BASE_PATH } from "@/lib/basePath";

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
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-whatsapp-bg p-4"
      style={{
        backgroundImage: `linear-gradient(var(--login-bg-overlay), var(--login-bg-overlay)), url('${BASE_PATH}/img/login-bg.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Toggle de tema flutuante — pill com fundo translúcido para destacar sobre a foto. */}
      <div
        className="fixed top-4 right-4 rounded-full border border-whatsapp-border shadow-sm overflow-hidden"
        style={{ backgroundColor: "color-mix(in srgb, var(--color-panel) 85%, transparent)" }}
      >
        <div className="w-44">
          <ThemeToggle />
        </div>
      </div>

      <form
        onSubmit={entrar}
        aria-label="Formulário de login"
        className="login-card-in w-full max-w-md p-8 sm:p-10 rounded-2xl bg-whatsapp-panel border border-whatsapp-border space-y-6"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.6) inset, 0 30px 60px -20px rgba(15,23,34,0.35), 0 8px 20px -8px rgba(15,23,34,0.18)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Image
              src={`${BASE_PATH}/img/logoImip.png`}
              alt="IMIP"
              width={96}
              height={96}
              priority
              unoptimized
              className="h-16 w-auto"
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-3xl font-semibold tracking-tight text-whatsapp-text">JUREMA</h1>
            <p className="text-sm text-whatsapp-muted tracking-wide">Teleconsultoria IMIP</p>
          </div>
        </div>

        <div className="h-px bg-whatsapp-border/70" aria-hidden="true" />

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-whatsapp-muted">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@imip.org.br"
              className="w-full px-3.5 py-2.5 rounded-lg bg-whatsapp-panel2 border border-whatsapp-border text-whatsapp-text placeholder:text-whatsapp-muted/70 focus:outline-none focus:border-whatsapp-accent focus:ring-2 focus:ring-whatsapp-accent/20 transition"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-whatsapp-muted">
              Senha
            </span>
            <PasswordInput
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!erro}
              aria-describedby={erro ? "login-error" : undefined}
              className="px-3.5 py-2.5"
            />
          </label>
        </div>

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
          className="w-full py-3 rounded-lg bg-whatsapp-accent text-white font-medium tracking-wide transition hover:bg-[var(--color-accent-hover)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
