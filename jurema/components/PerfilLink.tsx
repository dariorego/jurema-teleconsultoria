"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";

export function PerfilLink() {
  const pathname = usePathname();
  const active = pathname === "/perfil" || pathname.startsWith("/perfil/");
  return (
    <Link
      href={"/perfil" as never}
      title="Perfil"
      aria-current={active ? "page" : undefined}
      className={[
        "sb-item w-full flex items-center gap-2 px-3 py-2 rounded text-sm",
        active
          ? "bg-whatsapp-panel2 text-whatsapp-text font-medium"
          : "text-whatsapp-muted hover:text-whatsapp-text hover:bg-whatsapp-panel2",
      ].join(" ")}
    >
      <User size={16} />
      <span className="sb-label">Perfil</span>
    </Link>
  );
}
