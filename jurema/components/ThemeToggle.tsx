"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Alternar para modo claro" : "Alternar para modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="sb-item w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-whatsapp-panel2 text-whatsapp-text text-sm"
    >
      {mounted ? (
        isDark ? <Sun size={16} /> : <Moon size={16} />
      ) : (
        <span className="w-4 h-4" />
      )}
      <span className="sb-label">{mounted ? (isDark ? "Modo claro" : "Modo escuro") : "Tema"}</span>
    </button>
  );
}
