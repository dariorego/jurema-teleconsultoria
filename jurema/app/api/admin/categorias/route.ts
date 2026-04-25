import { NextResponse } from "next/server";
import { createSupabaseServiceRole } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

const CODIGO_REGEX = /^[a-z][a-z0-9_]{1,31}$/;

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const body = await req.json().catch(() => ({}));
  const codigo: string | undefined = body.codigo?.trim().toLowerCase();
  const rotulo: string | undefined = body.rotulo?.trim();
  const ordem: number = Number.isFinite(body.ordem) ? Number(body.ordem) : 0;

  if (!codigo || !rotulo) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!CODIGO_REGEX.test(codigo)) {
    return NextResponse.json(
      { error: "codigo_invalido", detail: "use minúsculas, dígitos ou underline (ex: medico)" },
      { status: 400 },
    );
  }

  const svc = createSupabaseServiceRole();
  const { error } = await svc.from("jurema_especialidades").insert({
    codigo,
    rotulo,
    ordem,
    ativo: true,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "codigo_ja_existe" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, codigo });
}
