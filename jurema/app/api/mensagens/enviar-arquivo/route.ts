import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseServiceRole } from "@/lib/supabase/server";
import { sendMedia } from "@/lib/turnio";

const MAX_BYTES = 16 * 1024 * 1024; // 16MB — limite prático de mídia WhatsApp

function kindFromMime(mime: string): "image" | "audio" | "video" | "document" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "form_invalido" }, { status: 400 });
  const conversaId = String(form.get("conversaId") ?? "");
  const caption = String(form.get("caption") ?? "").trim();
  const file = form.get("file");
  if (!conversaId || !(file instanceof File)) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (file.size === 0) return NextResponse.json({ error: "arquivo_vazio" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "arquivo_muito_grande" }, { status: 413 });

  const svc = createSupabaseServiceRole();
  const { data: conv } = await svc
    .from("jurema_conversas")
    .select(`
      id, status, especialista_id,
      paciente:jurema_pacientes(wa_id)
    `)
    .eq("id", conversaId)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: "nao_encontrada" }, { status: 404 });
  if (conv.especialista_id !== user.id)
    return NextResponse.json({ error: "nao_atribuida" }, { status: 403 });
  if (conv.status !== "em_atendimento")
    return NextResponse.json({ error: "status_invalido" }, { status: 409 });

  const paciente = Array.isArray(conv.paciente) ? conv.paciente[0] : conv.paciente;
  const wa_id = paciente?.wa_id;
  if (!wa_id) return NextResponse.json({ error: "sem_wa_id" }, { status: 400 });

  const mime = file.type || "application/octet-stream";
  const kind = kindFromMime(mime);
  const safeName = (file.name || "arquivo").replace(/[^\w.\-]+/g, "_").slice(-80);
  const path = `outbound/${conversaId}/${Date.now()}-${safeName}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const upload = await svc.storage
    .from("jurema-media")
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (upload.error) {
    return NextResponse.json(
      { error: "upload_falhou", detail: upload.error.message },
      { status: 502 },
    );
  }

  // Signed URL com 1h de validade — tempo suficiente para Turn.io baixar.
  const signed = await svc.storage
    .from("jurema-media")
    .createSignedUrl(path, 60 * 60);
  if (signed.error || !signed.data?.signedUrl) {
    return NextResponse.json(
      { error: "signed_url_falhou", detail: signed.error?.message },
      { status: 502 },
    );
  }

  let turnId: string | null = null;
  try {
    const resp = await sendMedia(wa_id, kind, signed.data.signedUrl, caption || undefined);
    turnId = resp.messages?.[0]?.id ?? null;
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    await svc.from("jurema_mensagens").insert({
      conversa_id: conversaId,
      wa_id,
      direction: "outbound",
      autor_user_id: user.id,
      tipo: kind,
      content: caption || file.name,
      media_path: path,
      media_mime: mime,
      status: "failed",
      raw: { error: detail },
    });
    return NextResponse.json({ error: "turnio_failed", detail }, { status: 502 });
  }

  const agora = new Date().toISOString();
  await svc.from("jurema_mensagens").insert({
    conversa_id: conversaId,
    wa_id,
    direction: "outbound",
    autor_user_id: user.id,
    tipo: kind,
    content: caption || file.name,
    media_path: path,
    media_mime: mime,
    turn_message_id: turnId,
    status: "sent",
  });

  await svc
    .from("jurema_conversas")
    .update({ ultima_mensagem_at: agora })
    .eq("id", conversaId);

  return NextResponse.json({ ok: true, turn_message_id: turnId, path });
}
