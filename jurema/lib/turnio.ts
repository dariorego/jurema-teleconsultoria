// Wrapper fino da API Turn.io.
// Referências: processTurn.md §2 + turnio_enviar_mensagem.json.

const BASE = process.env.TURN_IO_BASE_URL ?? "https://whatsapp.turn.io/v1";
const TOKEN = process.env.TURN_IO_TOKEN!;

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.v1+json",
  "Content-Type": "application/json",
};

/** Normaliza número para o formato Turn.io (55 + DDD + número, apenas dígitos). */
export function normalizeWaId(input: string): string {
  const only = input.replace(/\D/g, "");
  if (only.startsWith("55")) return only;
  return "55" + only;
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Turn.io ${res.status}: ${JSON.stringify(json)}`);
  }
  return json as { messages?: { id: string }[] };
}

export async function sendText(wa_id: string, text: string) {
  return post("/messages", {
    recipient_type: "individual",
    to: normalizeWaId(wa_id),
    type: "text",
    text: { body: text },
  });
}

export async function sendMedia(
  wa_id: string,
  kind: "image" | "audio" | "video" | "document",
  link: string,
  caption?: string,
) {
  const payload: Record<string, unknown> = {
    recipient_type: "individual",
    to: normalizeWaId(wa_id),
    type: kind,
    [kind]: { link, ...(caption ? { caption } : {}) },
  };
  return post("/messages", payload);
}

export async function sendButtons(
  wa_id: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
) {
  return post("/messages", {
    recipient_type: "individual",
    to: normalizeWaId(wa_id),
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
}

export async function sendList(
  wa_id: string,
  bodyText: string,
  buttonLabel: string,
  rows: { id: string; title: string; description?: string }[],
  sectionTitle = "Opções",
) {
  return post("/messages", {
    recipient_type: "individual",
    to: normalizeWaId(wa_id),
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: { button: buttonLabel, sections: [{ title: sectionTitle, rows }] },
    },
  });
}

export async function sendTemplate(
  wa_id: string,
  name: string,
  namespace: string,
  languageCode = "pt_BR",
  components: unknown[] = [],
) {
  return post("/messages", {
    recipient_type: "individual",
    to: normalizeWaId(wa_id),
    type: "template",
    template: {
      namespace,
      name,
      language: { policy: "deterministic", code: languageCode },
      components,
    },
  });
}
