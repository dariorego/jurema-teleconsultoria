"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Inbox, LayoutDashboard, Settings } from "lucide-react";
import type { ComponentType } from "react";

type Item = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  /** Identificador para mapear badges externos. */
  key?: "admin";
};

const baseItems: Item[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/caixa", label: "Caixa", icon: Inbox },
  { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
];

const adminItem: Item = { href: "/admin/usuarios", label: "Admin", icon: Settings, key: "admin" };

export function SidebarNav({
  isAdmin = false,
  adminBadge = 0,
}: {
  isAdmin?: boolean;
  adminBadge?: number;
}) {
  const pathname = usePathname();
  const items = isAdmin ? [...baseItems, adminItem] : baseItems;
  return (
    <nav className="flex-1 p-2 space-y-1">
      {items.map(({ href, label, icon: Icon, key }) => {
        const active =
          href === "/admin/usuarios"
            ? pathname.startsWith("/admin")
            : pathname === href || pathname.startsWith(href + "/");
        const badge = key === "admin" ? adminBadge : 0;
        return (
          <Link
            key={href}
            href={href as never}
            aria-current={active ? "page" : undefined}
            title={badge > 0 ? `${label} (${badge} pendente${badge === 1 ? "" : "s"})` : label}
            className={[
              "sb-item flex items-center gap-2 px-3 py-2 rounded text-sm",
              active
                ? "bg-whatsapp-panel2 text-whatsapp-text font-medium"
                : "text-whatsapp-muted hover:text-whatsapp-text hover:bg-whatsapp-panel2",
            ].join(" ")}
          >
            <Icon size={16} />
            <span className="sb-label flex-1">{label}</span>
            {badge > 0 && (
              <span className="sb-label inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
