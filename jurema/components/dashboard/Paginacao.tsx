"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const PER_PAGE_OPTIONS = [15, 20, 50, 100];

export function Paginacao({
  paramPrefix,
  page,
  perPage,
  total,
}: {
  paramPrefix: string;
  page: number;
  perPage: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const pageKey = `${paramPrefix}p`;
  const perKey = `${paramPrefix}n`;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const q = next.toString();
    start(() => router.replace((q ? `${pathname}?${q}` : pathname) as never, { scroll: false }));
  }

  if (total === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 24px",
        borderTop: "1px solid var(--d-border)",
        fontSize: 12,
        color: "var(--d-text-3)",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>Itens por página</span>
        <select
          value={perPage}
          onChange={(e) =>
            update({
              [perKey]: e.target.value === "15" ? null : e.target.value,
              [pageKey]: null,
            })
          }
          style={{
            padding: "4px 8px",
            background: "var(--d-surface-2)",
            border: "1px solid var(--d-border)",
            borderRadius: 4,
            color: "var(--d-text)",
            fontFamily: "inherit",
            fontSize: 12,
          }}
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span style={{ color: "var(--d-text-3)" }}>
          {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, total)} de {total}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <PageBtn
          disabled={safePage <= 1}
          onClick={() => update({ [pageKey]: safePage - 1 === 1 ? null : String(safePage - 1) })}
        >
          ←
        </PageBtn>
        <span style={{ padding: "0 10px" }}>
          {safePage} / {totalPages}
        </span>
        <PageBtn
          disabled={safePage >= totalPages}
          onClick={() => update({ [pageKey]: String(safePage + 1) })}
        >
          →
        </PageBtn>
      </div>
      {pending && (
        <span style={{ position: "absolute", right: 12, fontSize: 11 }}>…</span>
      )}
    </div>
  );
}

function PageBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        display: "grid",
        placeItems: "center",
        background: "var(--d-surface)",
        border: "1px solid var(--d-border)",
        borderRadius: 4,
        color: disabled ? "var(--d-text-3)" : "var(--d-text-2)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "inherit",
        fontSize: 13,
      }}
    >
      {children}
    </button>
  );
}
