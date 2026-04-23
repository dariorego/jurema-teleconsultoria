# Implementação 01 – Turn.io + N8N + Supabase
**Projeto:** IMIP – Instituto de Medicina Integral Prof. Fernando Figueira  
**Data:** 19/04/2026  
**Objetivo:** Ativar envio e recebimento de mensagens WhatsApp via Turn.io (API Oficial Meta), com automação no N8N e rastreamento de conversas no Supabase.

---

## Infraestrutura utilizada

| Serviço | URL / Referência |
|---|---|
| Turn.io (WhatsApp API) | `https://whatsapp.turn.io/v1/` |
| N8N (servidor real) | `https://n8n.projetosimip.online` |
| N8N (URL de exibição) | `https://n8n-whok.srv674963.hstgr.cloud` |
| Supabase | `https://uwwcrulhfrleqlmgmbcm.supabase.co` |

> ⚠️ A variável `WEBHOOK_URL` do N8N aponta para o domínio de exibição (`n8n-whok`), mas o servidor real que responde é `n8n.projetosimip.online`. Sempre usar o domínio real para chamadas de API e webhooks.

---

## Credenciais N8N (Header Auth)

Criar no N8N em **Settings → Credentials → New → Header Auth**:

### Turn.io API Token
- **Name (Header):** `Authorization`
- **Value:** `Bearer {TOKEN_DO_TURN_IO}`

### Supabase Anon Key
- **Name (Header):** `Authorization`
- **Value:** `Bearer {SUPABASE_ANON_KEY}`

---

## Fluxo 1 – Consultar Contato no Turn.io

**Arquivo:** `turnio_consultar_contato.json`  
**Webhook:** `POST https://n8n.projetosimip.online/webhook/turn-consultar-contato`

### O que faz
Consulta o perfil de um contato na Turn.io pelo número de telefone.

### Como usar
```json
POST /webhook/turn-consultar-contato
{ "wa_id": "5581999999999" }
```

### Resposta de sucesso
```json
{
  "success": true,
  "wa_id": "5581999999999",
  "contato": { "name": "...", "opted_in": true, ... }
}
```

### Endpoint Turn.io utilizado
```
GET https://whatsapp.turn.io/v1/contacts/{wa_id}/profile
```

> ⚠️ Se o contato não existir, o Turn.io o cria automaticamente.

---

## Fluxo 2 – Enviar Mensagem pelo Turn.io

**Arquivo:** `turnio_enviar_mensagem.json`  
**Webhook:** `POST https://n8n.projetosimip.online/webhook/turn-enviar-mensagem`

### O que faz
Envia qualquer tipo de mensagem WhatsApp: texto, imagem, áudio, vídeo, documento, sticker, template ou interativo (botões).

### Exemplos de uso

**Texto simples (dentro da janela de 24h):**
```json
{
  "wa_id": "5581999999999",
  "tipo": "texto",
  "texto": "Olá! Tudo bem?"
}
```

**Template (fora da janela de 24h):**
```json
{
  "wa_id": "5581999999999",
  "tipo": "template",
  "template_namespace": "266c277a_f881_42da_bf31_44dc4b94cd5e",
  "template_nome": "aviso_agenda_com_pergunta",
  "template_idioma": "pt_BR",
  "template_componentes": []
}
```

**Interativo (botões):**
```json
{
  "wa_id": "5581999999999",
  "tipo": "interativo",
  "interativo": {
    "type": "button",
    "body": { "text": "Confirma sua consulta?" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "sim", "title": "✅ Sim" } },
        { "type": "reply", "reply": { "id": "nao", "title": "❌ Não" } }
      ]
    }
  }
}
```

---

## Fluxo 3 – Aviso de Agenda com Pergunta (Primeiro Contato)

**Arquivo:** `turnio_aviso_agenda_com_pergunta.json`  
**Webhook:** `POST https://n8n.projetosimip.online/webhook/turn-aviso-agenda`

### Por que esse fluxo existe
A API Oficial da Meta exige que toda mensagem iniciada pela empresa (fora da janela de 24h) use um **template pré-aprovado**. Este fluxo é o ponto de entrada padrão para novos pacientes.

### Template utilizado
| Campo | Valor |
|---|---|
| Nome | `aviso_agenda_com_pergunta` |
| Namespace | `266c277a_f881_42da_bf31_44dc4b94cd5e` |
| Idioma | `pt_BR` |
| Componentes | nenhum (template sem variáveis) |

### Mensagem enviada ao paciente
> *Olá tudo bem? Esse é o WhatsApp do IMIP*
>
> *Queremos falar com você sobre um agendamento no IMIP.*
>
> *Você aceita receber nossas mensagens?*
>
> [ **Sim** ]  [ **Não** ]

### Como usar
```json
POST /webhook/turn-aviso-agenda
{ "wa_id": "5581999999999" }
```

### Códigos de erro comuns
| Código | Significado |
|---|---|
| 470 | Contato bloqueado ou número inválido |
| 1006 | Usuário não está no WhatsApp |

---

## Fluxo 4 – Webhook de Mensagens → Supabase

**Arquivo:** `turnio_webhook_mensagens.json`  
**Webhook N8N:** `POST https://n8n.projetosimip.online/webhook/turn-mensagens-webhook`

### O que faz
Recebe todos os eventos do Turn.io (mensagens dos pacientes + confirmações de entrega das mensagens enviadas) e salva no Supabase para rastreamento de conversas.

### Configuração no Turn.io

Acessar **Turn.io → Settings → Webhooks → Novo Webhook**:

| Opção | Configuração |
|---|---|
| URL | `https://n8n.projetosimip.online/webhook/turn-mensagens-webhook` |
| Receber mensagens de entrada e eventos do número | ✅ Ativado |
| Receber mensagens de saída (excluindo Jornadas) | ✅ Ativado |
| Receber mensagens de saída enviadas por Jornadas | ✅ Ativado |
| Somente usuários com Opted In | ❌ Desativado |
| Webhook ativado | ✅ Ativado |

### Tabela no Supabase

```sql
CREATE TABLE mensagens_whatsapp (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id   TEXT        UNIQUE,
  wa_id        TEXT        NOT NULL,
  contact_name TEXT,
  direction    TEXT        NOT NULL DEFAULT 'inbound',
  type         TEXT        NOT NULL DEFAULT 'text',
  content      TEXT,
  status       TEXT,
  timestamp    TIMESTAMPTZ,
  raw          JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

> O script completo para criar a tabela está em `turnio_mensagens_supabase.sql`.

### Tipos de evento processados
- **`messages[]`** → mensagens inbound (enviadas pelo paciente), salvas com `direction: 'inbound'`
- **`statuses[]`** → atualizações de entrega (sent/delivered/read/failed), salvas com `direction: 'outbound'`

### Headers obrigatórios na requisição ao Supabase
```
apikey: {SUPABASE_ANON_KEY}
Authorization: Bearer {SUPABASE_ANON_KEY}
Content-Type: application/json
Prefer: resolution=merge-duplicates,return=minimal
```

> O `Prefer: resolution=merge-duplicates` garante **upsert** — se chegar uma atualização de status de uma mensagem já salva, apenas atualiza o campo `status` sem duplicar o registro.

---

## Formato do número de telefone

Sempre usar formato internacional **sem o `+`**:

```
✅ 5581999999999   (correto)
❌ 81999999999     (falta o código do país)
❌ +5581999999999  (não usar o +)
```

---

## Arquivos gerados

| Arquivo | Descrição |
|---|---|
| `turnio_consultar_contato.json` | Workflow N8N – Consultar contato |
| `turnio_enviar_mensagem.json` | Workflow N8N – Enviar mensagem (todos os tipos) |
| `turnio_aviso_agenda_com_pergunta.json` | Workflow N8N – Template de primeiro contato |
| `turnio_webhook_mensagens.json` | Workflow N8N – Receber e salvar mensagens no Supabase |
| `turnio_mensagens_supabase.sql` | Script SQL – Criar tabela `mensagens_whatsapp` |

Todos os arquivos `.json` estão na pasta Downloads e podem ser importados diretamente no N8N via **menu superior → Import from file**.

---

## Problemas encontrados e soluções

**N8N respondendo 404 no domínio `n8n-whok`**  
O `WEBHOOK_URL` do N8N é apenas para exibição. O servidor real é `n8n.projetosimip.online`. Usar sempre o domínio real.

**Webhook 404 mesmo com domínio correto (modo teste)**  
No modo de teste, o webhook só fica ativo após clicar em "Listen for test event". Clicar primeiro, depois disparar a requisição no Postman.

**Mensagem enviada mas não chegava no WhatsApp**  
Número sem o código do país `55`. Corrigir para `5581...`.

**Mensagem não salvando no Supabase**  
O Supabase REST exige dois headers: `apikey` e `Authorization: Bearer`. O workflow inicial tinha apenas o `apikey`. Corrigido adicionando o `Authorization`.
