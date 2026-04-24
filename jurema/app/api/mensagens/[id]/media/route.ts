import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseServiceRole } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = createSupabaseServiceRole();
  const { data: msg } = await svc
    .from("jurema_mensagens")
    .select("id, conversa_id, media_path")
    .eq("id", id)
    .maybeSingle();
  if (!msg?.media_path) return NextResponse.json({ error: "nao_encontrada" }, { status: 404 });

  const { data, error } = await svc.storage
    .from("jurema-media")
    .createSignedUrl(msg.media_path, 60 * 5);
  if (error || !data?.signedUrl)
    return NextResponse.json({ error: error?.message ?? "sem_url" }, { status: 502 });

  return NextResponse.redirect(data.signedUrl, 307);
}
