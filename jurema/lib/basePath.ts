/**
 * Prefixo de rota configurado via NEXT_PUBLIC_BASE_PATH (ex: "/jurema").
 * Next.js aplica automaticamente a Link, router.push e <Image>, mas NÃO
 * a `fetch(...)` nem a NextResponse.redirect — usar o helper aqui
 * para qualquer URL construída manualmente.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefixa a rota com BASE_PATH (ex: apiUrl("/api/foo") => "/jurema/api/foo"). */
export function apiUrl(path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${BASE_PATH}${path}`;
}
