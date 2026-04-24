"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function AppShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
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

      <aside className="hidden md:flex bg-whatsapp-panel border-r border-whatsapp-border flex-col">
        {sidebar}
      </aside>

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
        {sidebar}
      </aside>

      <main className="bg-whatsapp-bg min-h-[calc(100vh-3.5rem)] md:min-h-screen">
        {children}
      </main>
    </div>
  );
}
