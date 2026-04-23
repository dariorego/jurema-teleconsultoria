# JUREMA — Teleconsultoria IMIP

Plataforma de teleconsultoria médica via WhatsApp. **Turn.io** (canal Meta)
+ **N8N** (automação) + **Supabase** (Postgres/Auth/Realtime/Storage)
+ **Next.js 15** rodando em **Docker local**.

## Estrutura

```
jurema/
├── app/                 # Next.js (App Router)
│   ├── (app)/           # área autenticada: /caixa, /chat/[id], /dashboard
│   ├── login/
│   └── api/             # routes: puxar, encerrar, enviar mensagem
├── lib/                 # supabase, turnio wrapper, types
├── components/
├── supabase/migrations/ # 0001..0004
├── n8n/                 # workflows JUREMA (importar no N8N)
├── Dockerfile
└── docker-compose.yml
```

## Setup passo a passo

### 1. Preencher credenciais

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://uwwcrulhfrleqlmgmbcm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<já no .credenciais>
SUPABASE_SERVICE_ROLE_KEY=<PEGAR no Supabase Studio → Settings → API>
TURN_IO_TOKEN=<já no .credenciais>
TURN_IO_NUMERO_EQUIPE=<número da equipe IMIP, formato 5581XXXXXXXXX>
```

### 2. Rodar migrations no Supabase

No Supabase Studio → SQL Editor, rodar **nesta ordem**:

1. `supabase/migrations/0001_jurema_schema.sql`
2. `supabase/migrations/0002_jurema_rls.sql`
3. `supabase/migrations/0003_jurema_storage.sql`
4. `supabase/migrations/0004_jurema_seed.sql` (depois de criar usuários em Auth)

### 3. Criar usuários

No Supabase Studio → Authentication → Users → "Add user":

- 1 admin (ex: `admin@imip.br`)
- 1 especialista por especialidade (`medico@`, `psicologo@`, `nutricao@`, `social@`)

Copie os UUIDs e rode o seed (`0004_jurema_seed.sql`) substituindo placeholders.

### 4. Importar workflows no N8N

No N8N (`https://n8n.projetosimip.online`) → **Import from file**:

- `n8n/jurema_inbound.json` — máquina de estado + handoff
- `n8n/jurema_janela_24h.json` — cron reaviso 24h (opcional Fase 4)

Ative os workflows.

### 5. Configurar webhook Turn.io

Em Turn.io → Settings → Webhooks, apontar para:

```
https://n8n.projetosimip.online/webhook/jurema-inbound
```

Ativar: Mensagens de entrada + Mensagens de saída + Mensagens de saída de Jornadas.

### 6. Rodar local

```bash
cd jurema
docker compose up --build
```

Acesse `http://localhost:3000`.

## Fluxo conversacional

```
Paciente envia "teleconsultoria"
    ├── wa_id existe → "Olá, {Nome}" → (A)
    └── novo → coleta: primeiro_nome → ultimo_nome → cpf → hospital → (A)
(A) Lista: Médica(o) / Psicóloga(o) / Nutricionista / Assist. Social
    ↓
Botões: Teleatendimento | Enviar texto
    ├── Teleatendimento → solicitação pendente + notifica equipe (agendamento manual)
    └── Texto → conversa na caixa da especialidade → especialista puxa e responde
```

Enquanto conversa está `em_atendimento`, o webhook N8N NÃO processa como
máquina de estado — só grava a mensagem inbound no histórico para a UI
mostrar em tempo real.

## Verificação

### Fase 1 (UI sem bot)
1. Inserir manualmente um paciente + conversa (status=fila, especialidade=medico) no Supabase
2. Login como o especialista médico → conversa aparece em `/caixa`
3. Puxar → chat abre → digitar → chega no WhatsApp de teste

### Fase 2 (bot ponta-a-ponta)
1. De um número novo, enviar "teleconsultoria"
2. Completar o fluxo escolhendo "Enviar texto"
3. Confirmar `jurema_pacientes` + `jurema_conversas(status=fila)` no Supabase
4. Especialista puxa e responde → paciente recebe no WhatsApp
5. Reenviar "teleconsultoria" do mesmo número → deve cumprimentar pelo nome

### Fase 4 (janela 24h)
1. Alterar manualmente `ultima_inbound_at` de uma conversa para ~22h30 atrás
2. Executar workflow cron manualmente
3. Conferir template enviado e `reaviso_24h_enviado_at` marcado

## Notas de implementação

- **Realtime**: tabelas `jurema_conversas` e `jurema_mensagens` publicadas via
  `supabase_realtime`. UI subscribe em `postgres_changes`.
- **RLS**: especialista só vê sua especialidade. Admin vê tudo.
  API routes usam `SUPABASE_SERVICE_ROLE_KEY` quando precisam bypassar RLS
  (ex: insert de `jurema_mensagens` outbound).
- **Som de notificação**: coloque `notify.mp3` em `public/sounds/`.
- **Bugs já mapeados** (ver `../processTurn.md`): header duplo `apikey` +
  `Authorization: Bearer` no Supabase; `?on_conflict=` em upserts; formato
  telefone `55DDDNUMERO`; Set node "Preservar Dados" após HTTP de envio.
