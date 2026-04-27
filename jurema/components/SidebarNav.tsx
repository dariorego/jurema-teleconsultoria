"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Inbox, LayoutDashboard, Settings } from "lucide-react";
import type { ComponentType } from "react";

type Item = { href: string; label: string; icon: ComponentType<{ size?: number }> };

const baseItems: Item[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/caixa", label: "Caixa", icon: Inbox },
  { href: "/ajuda", label: "Ajuda", icon: HelpCircle },
];

const adminItem: Item = { href: "/admin/usuarios", label: "Admin", icon: Settings };

export function SidebarNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...baseItems, adminItem] : baseItems;
  return (
    <nav className="flex-1 p-2 space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin/usuarios"
            ? pathname.startsWith("/admin")
            : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href as never}
            aria-current={active ? "page" : undefined}
            className={[
              "flex items-center gap-2 px-3 py-2 rounded text-sm",
              active
                ? "bg-whatsapp-panel2 text-whatsapp-text font-medium"
                : "text-whatsapp-muted hover:text-whatsapp-text hover:bg-whatsapp-panel2",
            ].join(" ")}
          >
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
