"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

const COLLAPSE_KEY = "jurema:sidebar:collapsed";

export function AppShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
}
& { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();

  // Hidrata o estado de colapso do localStorage. Antes da hidratação
  // renderizamos a versão expandida (default) para evitar mismatch.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed, hydrated]);

  // Fecha drawer quando muda de rota.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ESC fecha o drawer mobile e bloqueia scroll do body enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const desktopWidth = collapsed ? "md:grid-cols-[68px_1fr]" : "md:grid-cols-[240px_1fr]";

  return (
    <div className={`min-h-screen md:grid ${desktopWidth} transition-[grid-template-columns] duration-200`}>
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b border-whatsapp-border bg-whatsapp-panel">
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="p-2 -ml-2 rounded hover:bg-whatsapp-panel2 text-whatsapp-text"
        >
          <Menu size={20} />
        </button>
        <div className="font-semibold text-whatsapp-text">JUREMA</div>
      </header>

      {/* Sidebar desktop — sticky, ocupa altura total da viewport.
          Estrutura: header (fixo) + nav (flex-1, rola só se preciso) + footer (fixo).
          Garante que "Sair" esteja sempre visível mesmo com muitos itens. */}
      <aside
        data-collapsed={collapsed ? "true" : "false"}
        className="hidden md:flex sticky top-0 self-start h-screen bg-whatsapp-panel border-r border-whatsapp-border flex-col overflow-hidden"
      >
        <div className="relative flex-1 flex flex-col min-h-0">{sidebar}</div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-expanded={!collapsed}
          className="absolute -right-3 top-6 z-10 w-6 h-6 grid place-items-center rounded-full border border-whatsapp-border bg-whatsapp-panel text-whatsapp-muted hover:text-whatsapp-text shadow-sm"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        role="dialog"
        aria-label="Menu"
        aria-modal="true"
        hidden={!open}
        className={[
          "md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-whatsapp-panel border-r border-whatsapp-border flex-col",
          "transition-transform duration-200",
          open ? "flex translate-x-0" : "flex -translate-x-full",
        ].join(" ")}
      >
        <div className="flex justify-end p-2">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="p-2 rounded hover:bg-whatsapp-panel2 text-whatsapp-text"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">{sidebar}</div>
      </aside>

      <main className="bg-whatsapp-bg min-h-[calc(100vh-3.5rem)] md:min-h-screen min-w-0">
        {children}
      </main>
    </div>
  );
}
