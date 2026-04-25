import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (arr: CookieSet[]) => {
          arr.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          arr.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Com basePath="/jurema", request.nextUrl.pathname vem SEM o prefixo
  // ("/login", "/dashboard" etc.) — Next já tirou. Para redirects,
  // precisamos RE-incluir o prefixo na url gerada.
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login");
  const isApi = pathname.startsWith("/api/");
  const isPublicApi = pathname.startsWith("/api/webhook");

  if (!user && !isAuthRoute && !isPublicApi) {
    if (isApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = `${basePath}/login`;
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `${basePath}/dashboard`;
    return NextResponse.redirect(url);
  }

  return response;
}
