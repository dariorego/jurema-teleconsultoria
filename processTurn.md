# processTurn.md
## Conhecimento Técnico Consolidado — WhatsApp Automation com Turn.io + N8N + Supabase
**Projeto:** IMIP – Instituto de Medicina Integral Prof. Fernando Figueira  
**Acumulado em:** Abril 2026  
**Destino:** Base de conhecimento para desenvolvimento de plataforma em Claude Code

---

## 1. Visão Geral da Arquitetura

```
Paciente (WhatsApp)
        ↕
   Turn.io (API Oficial Meta / WhatsApp Business API)
        ↕  webhooks bidirecionais
   N8N  (orquestrador de workflows / automação)
        ↕
   Supabase (banco PostgreSQL + REST API)
```

### Por que essa stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Canal | Turn.io | API Oficial Meta, suporte a templates, journeys, webhooks |
| Automação | N8N | Low-code, visual, sem vendor lock-in, self-hostável |
| Banco | Supabase | PostgreSQL + REST pronto, sem backend customizado |

---

## 2. Turn.io — Tudo que Aprendemos

### 2.1 Endpoints principais

```
Base URL: https://whatsapp.turn.io/v1/

Enviar mensagem:    POST /messages
Consultar contato:  GET  /contacts/{wa_id}/profile
```

### 2.2 Headers obrigatórios em TODAS as chamadas

```http
Authorization: Bearer {TOKEN_DO_TURN_IO}
Accept: application/vnd.v1+json
Content-Type: application/json
```

> ⚠️ O header `Accept: application/vnd.v1+json` é obrigatório e exclusivo do Turn.io. Sem ele, a API retorna erro ou resposta inesperada.

### 2.3 Formato do número de telefone

```
✅ 5581999999999   (55 + DDD + número — sem espaços, sem +)
❌ +5581999999999  (não usar o +)
❌ 81999999999     (falta o código do país 55)
```

### 2.4 Tipos de mensagem suportados

| tipo | campo | observação |
|---|---|---|
| `text` | `text.body` | Texto simples, até 4096 chars |
| `interactive` (button) | `interactive.action.buttons` | Máx. 3 botões Quick Reply |
| `interactive` (list) | `interactive.action.sections[].rows` | Lista scrollável de opções |
| `template` | `template.name`, `template.namespace` | Obrigatório fora da janela de 24h |
| `image`, `audio`, `video`, `document` | `image.link` etc. | Mídia por URL pública |

### 2.5 Payload — texto simples

```json
{
  "recipient_type": "individual",
  "to": "5581999999999",
  "type": "text",
  "text": { "body": "Mensagem aqui" }
}
```

### 2.6 Payload — botões interativos (max 3)

```json
{
  "recipient_type": "individual",
  "to": "5581999999999",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "Qual forma de atendimento?" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "videochamada", "title": "Agendar videochamada" } },
        { "type": "reply", "reply": { "id": "mensagens_texto", "title": "Mensagens de texto" } }
      ]
    }
  }
}
```

### 2.7 Payload — lista interativa

```json
{
  "recipient_type": "individual",
  "to": "5581999999999",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": { "text": "Escolha a especialidade" },
    "action": {
      "button": "Ver opções",
      "sections": [{
        "title": "Especialidades",
        "rows": [
          { "id": "medico",        "title": "Médica(o)"         },
          { "id": "psicologo",     "title": "Psicologa(o)"      },
          { "id": "nutricionista", "title": "Nutricionista"     }
        ]
      }]
    }
  }
}
```

### 2.8 Payload — template (primeiro contato / fora da janela 24h)

```json
{
  "recipient_type": "individual",
  "to": "5581999999999",
  "type": "template",
  "template": {
    "namespace": "266c277a_f881_42da_bf31_44dc4b94cd5e",
    "name": "aviso_agenda_com_pergunta",
    "language": { "policy": "deterministic", "code": "pt_BR" },
    "components": []
  }
}
```

### 2.9 Webhooks Turn.io

Turn.io envia eventos via POST para a URL configurada em **Settings → Webhooks**.

**Estrutura do payload inbound (mensagem do paciente):**
```json
{
  "messages": [{
    "id": "msg_id",
    "from": "5581999999999",
    "timestamp": "1713000000",
    "type": "text",
    "text": { "body": "teleconsultoria" }
  }],
  "contacts": [{ "profile": { "name": "Nome do Contato" }, "wa_id": "5581999999999" }]
}
```

**Estrutura do payload de status (confirmação de entrega):**
```json
{
  "statuses": [{
    "id": "msg_id",
    "recipient_id": "5581999999999",
    "status": "delivered",
    "timestamp": "1713000001"
  }]
}
```

**Estrutura para button_reply (botão clicado):**
```json
{
  "messages": [{
    "from": "5581999999999",
    "type": "interactive",
    "interactive": {
      "type": "button_reply",
      "button_reply": { "id": "videochamada", "title": "Agendar videochamada" }
    }
  }]
}
```

**Estrutura para list_reply (item de lista selecionado):**
```json
{
  "messages": [{
    "from": "5581999999999",
    "type": "interactive",
    "interactive": {
      "type": "list_reply",
      "list_reply": { "id": "medico", "title": "Médica(o)" }
    }
  }]
}
```

> ⚠️ **IMPORTANTE:** Turn.io dispara o webhook tanto para mensagens inbound (paciente envia) quanto para eventos de status das mensagens outbound (sent/delivered/read). O webhook handler DEVE verificar se `body.messages` existe antes de processar. Eventos de status não têm `messages[]`.

### 2.10 Journeys e interceptação de mensagens

Turn.io tem um sistema de "Journeys" (jornadas) que pode interceptar mensagens de contatos que estão em um fluxo ativo. **Problema real encontrado:** se o contato já está em uma Journey (ex: ONCOHELP), as mensagens dele NÃO chegam ao webhook customizado — são interceptadas pela Journey.

**Solução:** desabilitar a Journey para os contatos que devem passar pelo fluxo N8N, ou adicionar uma condição de exceção na Journey:
```
message.text != "teleconsultoria"
```

### 2.11 Configuração recomendada do webhook Turn.io

| Opção | Valor |
|---|---|
| URL | `https://seu-n8n.dominio.com/webhook/nome-do-webhook` |
| Mensagens de entrada | ✅ Ativado |
| Mensagens de saída (excluindo Jornadas) | ✅ Ativado |
| Mensagens de saída de Jornadas | ✅ Ativado |
| Somente opted-in | ❌ Desativado (para não perder mensagens) |
| Webhook ativo | ✅ Ativado |

---

## 3. N8N — Padrões e Aprendizados

### 3.1 Infraestrutura

```
Servidor real:    https://n8n.projetosimip.online
URL de exibição:  https://n8n-whok.srv674963.hstgr.cloud  (só visual)
```

> ⚠️ A variável `WEBHOOK_URL` do N8N aponta para o domínio de exibição. **Sempre usar o domínio real** (`n8n.projetosimip.online`) para chamadas API e configurações de webhook externas.

### 3.2 Paths de webhook

```
Produção (workflow ativo):  /webhook/{path}
Teste (workflow inativo):   /webhook-test/{path}
```

> No modo de teste, o webhook só fica ativo depois de clicar em **"Listen for test event"** no N8N. Clicar primeiro, só depois disparar a requisição.

### 3.3 Padrão fan-out: responder 200 + processar em paralelo

Turn.io espera resposta em menos de 5 segundos. Solução: o Webhook node envia imediatamente 200 OK via `Respond to Webhook` e processa os dados em paralelo pela saída paralela do mesmo nó.

```
Webhook Turn.io
    ├──→ Responder 200 OK   (imediato)
    └──→ Extrair Dados      (processamento)
```

No N8N, isso é feito conectando DOIS nós à mesma saída do Webhook:
- Saída `main[0]` → Responder 200 OK
- Saída `main[0]` → Extrair Dados (segunda conexão na mesma saída)

### 3.4 Padrão de máquina de estado com Supabase

Para fluxos conversacionais com múltiplos passos, o padrão usado:

```
1. Webhook recebe mensagem
2. Extrair wa_id e texto da mensagem
3. Buscar sessão ativa no Supabase (GET com wa_id filter)
4. Code node processa o step atual → retorna próxima mensagem e novo step
5. Montar payload Turn.io (texto / botões / lista)
6. Enviar mensagem ao paciente via Turn.io API
7. Preservar dados via Set node
8. Atualizar sessão no Supabase (upsert com wa_id)
9. Se concluído → salvar solicitação + notificar equipe
```

### 3.5 Credenciais N8N — Header Auth

Criar em **Settings → Credentials → New → Header Auth**:

**Turn.io API Token:**
- Name (Header): `Authorization`
- Value: `Bearer {TOKEN_DO_TURN_IO}`

> Aplicar nos nós HTTP Request que chamam `whatsapp.turn.io`

### 3.6 neverError e fullResponse — como usar corretamente

```json
"options": {
  "response": {
    "response": {
      "neverError": true,
      "fullResponse": true
    }
  }
}
```

| Opção | Comportamento |
|---|---|
| `neverError: true` | Erros HTTP (4xx, 5xx) aparecem como Success no N8N — útil para não quebrar o fluxo em erros esperados (ex: status updates que chegam ao mesmo webhook) |
| `neverError: false` (padrão) | Erros HTTP causam falha vermelha no nó — útil para debugging |
| `fullResponse: true` | Output contém `{body, statusCode, headers}` em vez de apenas o body |

> ⚠️ **Armadilha:** `neverError: true` mascara erros reais do Supabase e outros serviços. Durante desenvolvimento, manter `neverError: false` para ver os erros. Em produção, usar com cuidado e logar o statusCode.

### 3.7 Cross-node reference — problema real

Em N8N, referenciar dados de nós anteriores via `$('NomeDo Nó').item.json.campo` funciona na maioria dos casos. Mas após um nó HTTP que substitui o contexto (ex: `Enviar Mensagem Turn.io`), a referência pode ser instável.

**Solução confirmada:** adicionar um **Set node** logo após o HTTP de envio para preservar explicitamente os dados necessários:

```json
// Nó: Preservar Dados (Set node, typeVersion 3.4)
assignments: [
  { name: "dados_sessao", value: "={{ $('Montar Payload Turn.io').item.json.dados_sessao }}", type: "object" },
  { name: "concluido",    value: "={{ $('Montar Payload Turn.io').item.json.concluido }}",    type: "boolean" },
  { name: "wa_id",        value: "={{ $('Montar Payload Turn.io').item.json.wa_id }}",        type: "string" }
]
```

### 3.8 specifyBody: "json" — não usar JSON.stringify

Quando `specifyBody: "json"` no HTTP Request node, o `jsonBody` deve receber um **objeto**, não uma string JSON. Usar `JSON.stringify()` pode causar double-encoding em algumas versões do N8N.

```javascript
// ✅ Correto
"jsonBody": "={{ $json.dados_sessao }}"

// ⚠️ Pode causar problema
"jsonBody": "={{ JSON.stringify($json.dados_sessao) }}"
```

### 3.9 Extraindo dados da mensagem Turn.io (Code node)

```javascript
const body = $input.first().json.body || {};
const messages = body.messages || [];

// Ignorar eventos sem mensagem (status updates)
if (messages.length === 0) {
  return [{ json: { ignorar: true } }];
}

const msg = messages[0];
const wa_id = msg.from || '';
const tipo_msg = msg.type || 'text';

let texto = '';
let interactive_id = null;
let interactive_title = null;

if (tipo_msg === 'text') {
  texto = (msg.text?.body || '').trim().toLowerCase();
} else if (tipo_msg === 'interactive') {
  const inter = msg.interactive || {};
  if (inter.type === 'list_reply') {
    interactive_id    = inter.list_reply?.id;
    interactive_title = inter.list_reply?.title;
  } else if (inter.type === 'button_reply') {
    interactive_id    = inter.button_reply?.id;
    interactive_title = inter.button_reply?.title;
  }
  texto = interactive_id || '';
}

return [{ json: { wa_id, texto, tipo_msg, interactive_id, interactive_title, ignorar: false } }];
```

---

## 4. Supabase — Tudo que Aprendemos

### 4.1 Configuração

```
URL:       https://uwwcrulhfrleqlmgmbcm.supabase.co
REST base: https://uwwcrulhfrleqlmgmbcm.supabase.co/rest/v1/
```

### 4.2 Headers obrigatórios em TODAS as chamadas

```http
apikey: {SUPABASE_ANON_KEY}
Authorization: Bearer {SUPABASE_ANON_KEY}
Content-Type: application/json
```

> ⚠️ **Bug real:** Supabase REST exige DOIS headers: `apikey` E `Authorization: Bearer`. Só o `apikey` não é suficiente para writes. Essa foi a causa principal de erros silenciosos no início do projeto.

### 4.3 Upsert (INSERT or UPDATE)

```http
POST /rest/v1/{tabela}?on_conflict={coluna_unique}
Prefer: resolution=merge-duplicates,return=representation
Content-Type: application/json

{ "campo": "valor", ... }
```

> ⚠️ **Importante:** incluir `?on_conflict={coluna}` na URL para o upsert detectar corretamente o conflito. Sem isso, pode INSERT duplicado ou erro.

### 4.4 Query (GET com filtros)

```http
GET /rest/v1/{tabela}?campo=eq.{valor}&outro=neq.{valor}&select=*&limit=1
```

Operadores disponíveis: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `is`

### 4.5 PATCH (update específico)

```http
PATCH /rest/v1/{tabela}?campo_pk=eq.{valor}
Content-Type: application/json

{ "campo": "novo_valor" }
```

### 4.6 RLS — Row Level Security

**Problema real:** mesmo rodando `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`, writes com a anon key foram bloqueados (401 com código PostgreSQL 42501).

**Solução definitiva:** executar ambos os comandos:

```sql
-- Desabilitar RLS
ALTER TABLE public.teleconsultoria_sessoes DISABLE ROW LEVEL SECURITY;

-- E também garantir os grants explícitos
GRANT ALL PRIVILEGES ON TABLE public.teleconsultoria_sessoes TO anon;
GRANT ALL PRIVILEGES ON TABLE public.teleconsultoria_sessoes TO authenticated;
```

> Nota: `DISABLE ROW LEVEL SECURITY` remove as políticas, mas os grants de role (PostgreSQL nativo) ainda se aplicam. Precisa dos dois.

### 4.7 Como verificar status do RLS

```sql
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('nome_da_tabela');
-- relrowsecurity = false → RLS desabilitado ✅
```

### 4.8 Bug real: coluna faltando causa loop silencioso

**Cenário:** workflow com nós HTTP e `neverError: true`. Se o POST ao Supabase inclui uma coluna que não existe na tabela (ex: `forma_atendimento: null` antes de rodar o `ALTER TABLE ADD COLUMN`), o Supabase retorna 400. Com `neverError: true`, o N8N ignora esse erro — a sessão não é atualizada — o step fica preso — loop infinito na conversa.

**Diagnóstico:** remover `neverError: true` temporariamente para ver o erro real.

**Prevenção:** sempre garantir que o schema do banco esteja sincronizado com os campos enviados pelo workflow ANTES de ativar o fluxo.

### 4.9 Padrão de tabelas para máquina de estado conversacional

```sql
-- Sessões ativas (uma linha por usuário)
CREATE TABLE teleconsultoria_sessoes (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  wa_id      TEXT    NOT NULL UNIQUE,   -- chave de upsert
  step       TEXT    NOT NULL DEFAULT 'passo_inicial'
             CHECK (step IN ('passo_1', 'passo_2', 'concluido')),
  dado_1     TEXT,
  dado_2     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registros concluídos (histórico permanente)
CREATE TABLE solicitacoes (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  wa_id      TEXT    NOT NULL,
  dado_1     TEXT,
  dado_2     TEXT,
  status     TEXT    DEFAULT 'pendente'
             CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON teleconsultoria_sessoes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## 5. Fluxos N8N Criados

Todos os arquivos `.json` podem ser importados diretamente no N8N via **menu superior → Import from file**.

### Fluxo 1 — Consultar Contato Turn.io
**Arquivo:** `turnio_consultar_contato.json`  
**Webhook:** `POST /webhook/turn-consultar-contato`  
**Input:** `{ "wa_id": "5581999999999" }`  
**O que faz:** consulta o perfil de um contato na Turn.io pelo número. Útil para verificar se o número existe e está no WhatsApp.

### Fluxo 2 — Enviar Mensagem Turn.io (todos os tipos)
**Arquivo:** `turnio_enviar_mensagem.json`  
**Webhook:** `POST /webhook/turn-enviar-mensagem`  
**O que faz:** envia qualquer tipo de mensagem WhatsApp: texto, imagem, áudio, vídeo, documento, template ou interativo. Ponto único de envio para todos os tipos.

**Exemplos de input:**
```json
// Texto
{ "wa_id": "5581999999999", "tipo": "texto", "texto": "Olá!" }

// Template
{ "wa_id": "5581999999999", "tipo": "template", "template_nome": "aviso_agenda_com_pergunta", "template_namespace": "266c277a_f881_42da_bf31_44dc4b94cd5e", "template_idioma": "pt_BR", "template_componentes": [] }

// Interativo (botões)
{ "wa_id": "5581999999999", "tipo": "interativo", "interativo": { ... } }
```

### Fluxo 3 — Aviso de Agenda com Pergunta (Primeiro Contato)
**Arquivo:** `turnio_aviso_agenda_com_pergunta.json`  
**Webhook:** `POST /webhook/turn-aviso-agenda`  
**O que faz:** envia o template `aviso_agenda_com_pergunta` — obrigatório para iniciar conversa com paciente fora da janela de 24h. Retorna dois botões: Sim / Não.

**Template Turn.io:**
```
Nome:      aviso_agenda_com_pergunta
Namespace: 266c277a_f881_42da_bf31_44dc4b94cd5e
Idioma:    pt_BR
```

### Fluxo 4 — Webhook Mensagens → Supabase
**Arquivo:** `turnio_webhook_mensagens.json`  
**Webhook:** `POST /webhook/turn-mensagens-webhook`  
**O que faz:** recebe TODOS os eventos Turn.io (inbound e status de entrega) e salva na tabela `mensagens_whatsapp` no Supabase. Usado para rastreamento e histórico de conversas.

**Tabela Supabase:**
```
mensagens_whatsapp: id, message_id (UNIQUE), wa_id, contact_name,
                    direction (inbound/outbound), type, content, status,
                    timestamp, raw (JSONB), created_at, updated_at
```

### Fluxo 5 — Teleconsultoria IMIP (máquina de estado conversacional)
**Arquivo:** `turnio_teleconsultoria.json`  
**Webhook:** `POST /webhook/turn-teleconsultoria`  
**O que faz:** fluxo completo de coleta de dados para teleconsultoria via WhatsApp. Ativado pela palavra-chave `teleconsultoria`.

**Sequência:**
1. Paciente envia `teleconsultoria`
2. Sistema pede nome → sobrenome → CPF → Hospital
3. Botões: forma de atendimento (videochamada / mensagens de texto)
4. Lista: especialidade (Médica(o) / Psicologa(o) / Nutricionista / Assistente Social)
5. Mensagem final + salva no Supabase + notifica equipe

**Nós do workflow:**
```
Webhook Turn.io
├── Responder 200 OK
└── Extrair Dados (Code)
        ↓
    Tem mensagem? (IF — filtra status updates)
        ↓ true
    Buscar Sessão Supabase (GET)
        ↓
    Processar Estado (Code — máquina de estado)
        ↓
    Tem ação? (IF)
        ↓ true
    Montar Payload Turn.io (Code)
        ↓
    Enviar Mensagem Turn.io (HTTP)
        ↓
    Preservar Dados (Set)       ← CRÍTICO: evita perda de dados após HTTP
        ↓
    Atualizar Sessão Supabase (POST upsert)
        ↓
    Concluído? (IF)
        ↓ true
    Salvar Solicitação Supabase (POST)
        ↓
    Notificar Equipe Turn.io (HTTP)
```

**Tabelas Supabase:**
- `teleconsultoria_sessoes` — sessões ativas (uma linha por wa_id)
- `solicitacoes_teleconsultoria` — histórico de solicitações concluídas

---

## 6. Bugs Encontrados e Soluções

### Bug 1 — Mensagem enviada mas não chegava no WhatsApp
**Causa:** número sem código do país 55.  
**Solução:** sempre usar formato `5581999999999` (55 + DDD + número).

### Bug 2 — Webhook 404 mesmo com domínio correto
**Causa:** N8N em modo teste usa path `/webhook-test/`. Em produção usa `/webhook/`.  
**Solução:** ativar o workflow (toggle) antes de configurar webhooks externos em produção.

### Bug 3 — Supabase não salvando dados (writes falhando silenciosamente)
**Causa:** nó HTTP com apenas o header `apikey`. Supabase exige DOIS headers: `apikey` + `Authorization: Bearer`.  
**Solução:** adicionar ambos os headers em todos os nós que escrevem no Supabase.

### Bug 4 — neverError mascarando falhas reais
**Causa:** `neverError: true` nos nós HTTP faz o N8N tratar 4xx/5xx como sucesso. Erros do Supabase (401, 400) passavam sem ser notados.  
**Solução:** usar `neverError: false` em desenvolvimento. Em produção, adicionar nó de verificação do `statusCode`.

### Bug 5 — Supabase retornando 401 em writes (RLS bloqueando)
**Causa:** Role `anon` sem permissão de INSERT/UPDATE mesmo com `DISABLE ROW LEVEL SECURITY`.  
**Solução:** executar `GRANT ALL PRIVILEGES ON TABLE ... TO anon;` além do disable RLS.

### Bug 6 — Loop na máquina de estado (step nunca avança)
**Causa em cadeia:**
1. `forma_atendimento` incluída no body do POST (como `null`)
2. Coluna não existia na tabela (`teleconsultoria_update.sql` não havia sido rodado)
3. Supabase retornava 400 — N8N com `neverError: false` encerrava a execução
4. Sessão nunca era atualizada → step ficava em `aguardando_nome` → loop

**Solução:** sempre rodar todos os SQLs de schema **antes** de ativar o workflow. Garantir que as colunas no código existam no banco.

### Bug 7 — Cross-node reference perdida após nó HTTP
**Causa:** após `Enviar Mensagem Turn.io`, o contexto do item muda para a resposta HTTP. Referências como `$('Montar Payload').item.json.dados_sessao` ficavam instáveis.  
**Solução:** adicionar um **Set node ("Preservar Dados")** logo após o HTTP de envio para copiar explicitamente os campos necessários para o próximo nó.

---

## 7. SQL Files Criados

| Arquivo | Tabelas criadas |
|---|---|
| `turnio_mensagens_supabase.sql` | `mensagens_whatsapp`, função `set_updated_at()` |
| `teleconsultoria_supabase.sql` | `teleconsultoria_sessoes`, `solicitacoes_teleconsultoria` |
| `teleconsultoria_update.sql` | Adiciona coluna `forma_atendimento` nas tabelas de teleconsultoria |

**Ordem de execução:**
1. `turnio_mensagens_supabase.sql` (cria a função `set_updated_at` usada pelos outros)
2. `teleconsultoria_supabase.sql`
3. `teleconsultoria_update.sql`
4. Rodar os GRANTs de anon em cada tabela criada

---

## 8. Padrões Recomendados para a Plataforma

### 8.1 Arquitetura de fluxo WhatsApp

```
[Webhook entrada] → [Filtro mensagem real] → [Buscar estado]
→ [Processar estado] → [Montar resposta] → [Enviar Turn.io]
→ [Preservar dados] → [Atualizar estado] → [Verificar conclusão]
→ [Ações finais]
```

### 8.2 Separação de responsabilidades por nó N8N

| Nó | Responsabilidade |
|---|---|
| Code (Extrair Dados) | Parsear payload Turn.io → campos normalizados |
| IF (Tem mensagem?) | Filtrar eventos de status vs mensagens reais |
| HTTP (Buscar Sessão) | Leitura de estado do banco |
| Code (Processar Estado) | Toda a lógica de negócio e máquina de estado |
| Code (Montar Payload) | Formatar payload específico para o tipo de mensagem |
| HTTP (Enviar Turn.io) | Única responsabilidade: enviar ao canal |
| Set (Preservar Dados) | Bridge de dados entre HTTP e próximos nós |
| HTTP (Atualizar Sessão) | Persistência de estado no banco |

### 8.3 Campos mínimos de uma tabela de sessão

```sql
wa_id      TEXT NOT NULL UNIQUE  -- chave de upsert, nunca mudar
step       TEXT NOT NULL         -- passo atual da conversa
created_at TIMESTAMPTZ           -- rastreamento
updated_at TIMESTAMPTZ           -- trigger automático
```

### 8.4 Variáveis de ambiente a centralizar na plataforma

```env
# ── Turn.io ────────────────────────────────────────────────────
TURN_IO_TOKEN=
TURN_IO_BASE_URL=https://whatsapp.turn.io/v1
TURN_IO_NUMERO_EQUIPE=          # número que recebe notificações internas (formato: 5581999999999)

# ── Supabase ───────────────────────────────────────────────────
SUPABASE_URL=https://uwwcrulhfrleqlmgmbcm.supabase.co
SUPABASE_ANON_KEY=              # chave pública — usar no client-side e N8N
SUPABASE_SERVICE_ROLE_KEY=      # chave de admin — usar APENAS em server-side (Next.js API routes), nunca expor no front
SUPABASE_DB_PASSWORD=           # necessário se rodar migrations via psql ou Supabase CLI

# ── N8N ────────────────────────────────────────────────────────
N8N_URL=https://n8n.projetosimip.online
N8N_WEBHOOK_BASE=https://n8n.projetosimip.online/webhook
N8N_API_KEY=                    # necessário se integrar via MCP ou API do N8N
```

> **Regra de segurança:** `SUPABASE_SERVICE_ROLE_KEY` bypassa o RLS completamente. Nunca expor no cliente. Usar somente em Next.js API routes (`/app/api/`) ou funções server-side onde o código não é enviado ao browser.

### 8.5 Verificações obrigatórias antes de ativar qualquer fluxo

- [ ] Todos os SQLs de schema rodados na ordem correta
- [ ] GRANTs de `anon` executados em todas as tabelas
- [ ] RLS desabilitado ou policies criadas
- [ ] Workflow N8N ativado (toggle ON) antes de configurar webhook no Turn.io
- [ ] Turn.io webhook configurado com URL de produção (`/webhook/` não `/webhook-test/`)
- [ ] Colunas no código = colunas no banco (sem descompasso de schema)
- [ ] `neverError: false` em todos os nós de escrita durante validação inicial

---

## 9. Referências Rápidas

```
Turn.io API docs:   https://whatsapp.turn.io/v1/
N8N produção:       https://n8n.projetosimip.online
N8N exibição:       https://n8n-whok.srv674963.hstgr.cloud
Supabase:           https://uwwcrulhfrleqlmgmbcm.supabase.co
Supabase REST:      https://uwwcrulhfrleqlmgmbcm.supabase.co/rest/v1/
```

---

*Documento gerado a partir de implementação real com erros, debugging e soluções validadas em produção.*  
*Use este conhecimento como base para qualquer plataforma que integre WhatsApp Business API + automação + banco de dados.*
