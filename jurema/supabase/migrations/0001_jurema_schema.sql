-- JUREMA — Schema principal
-- Plataforma de teleconsultoria médica via WhatsApp (Turn.io)
-- Convenção: todas as tabelas prefixadas com "jurema_" para isolar do projeto IMIP.

-- ============================================================
-- Função utilitária: atualiza updated_at automaticamente
-- (reusa o padrão do turnio_mensagens_supabase.sql)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Tabela: jurema_pacientes
-- Cadastro persistente. Na 2ª vez que o paciente disser
-- "teleconsultoria", o bot reconhece pelo wa_id e pula a coleta.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurema_pacientes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_id           TEXT        NOT NULL UNIQUE,
  primeiro_nome   TEXT        NOT NULL,
  ultimo_nome     TEXT,
  cpf             TEXT,
  hospital        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jurema_pacientes_wa_id ON public.jurema_pacientes(wa_id);

CREATE TRIGGER trg_jurema_pacientes_updated_at
  BEFORE UPDATE ON public.jurema_pacientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Tabela: jurema_sessoes
-- Máquina de estado ativa (apenas enquanto o bot conduz o fluxo).
-- Uma linha por wa_id; removida (ou marcada concluido) ao final.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurema_sessoes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_id           TEXT        NOT NULL UNIQUE,
  step            TEXT        NOT NULL DEFAULT 'inicio'
                  CHECK (step IN (
                    'inicio',
                    'aguardando_primeiro_nome',
                    'aguardando_ultimo_nome',
                    'aguardando_cpf',
                    'aguardando_hospital',
                    'aguardando_especialidade',
                    'aguardando_modalidade',
                    'concluido'
                  )),
  -- buffer de dados enquanto coleta (sobrescreve jurema_pacientes ao concluir)
  primeiro_nome   TEXT,
  ultimo_nome     TEXT,
  cpf             TEXT,
  hospital        TEXT,
  especialidade   TEXT,
  modalidade      TEXT        CHECK (modalidade IN ('teleatendimento','texto') OR modalidade IS NULL),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jurema_sessoes_wa_id ON public.jurema_sessoes(wa_id);
CREATE INDEX IF NOT EXISTS idx_jurema_sessoes_step ON public.jurema_sessoes(step);

CREATE TRIGGER trg_jurema_sessoes_updated_at
  BEFORE UPDATE ON public.jurema_sessoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Tabela: jurema_especialidades (enum-tabela)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurema_especialidades (
  codigo  TEXT PRIMARY KEY,
  rotulo  TEXT NOT NULL,
  ordem   INT  NOT NULL DEFAULT 0
);

INSERT INTO public.jurema_especialidades (codigo, rotulo, ordem) VALUES
  ('medico',            'Médica(o)',         1),
  ('psicologo',         'Psicóloga(o)',      2),
  ('nutricao',          'Nutricionista',     3),
  ('assistente_social', 'Assistente Social', 4)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- Tabela: jurema_especialistas
-- Perfil vinculado a auth.users. Define em qual caixa atende.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurema_especialistas (
  user_id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome            TEXT        NOT NULL,
  especialidade   TEXT        REFERENCES public.jurema_especialidades(codigo),
  role            TEXT        NOT NULL DEFAULT 'especialista'
                  CHECK (role IN ('especialista','admin')),
  ativo           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jurema_especialistas_especialidade
  ON public.jurema_especialistas(especialidade) WHERE ativo = TRUE;

CREATE TRIGGER trg_jurema_especialistas_updated_at
  BEFORE UPDATE ON public.jurema_especialistas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Tabela: jurema_conversas
-- Uma conversa textual aberta com um paciente.
-- Status:
--   fila            → aguardando especialista puxar
--   em_atendimento  → especialista está respondendo
--   encerrada       → fechada manualmente ou por expiração
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurema_conversas (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id               UUID        NOT NULL REFERENCES public.jurema_pacientes(id),
  especialidade             TEXT        NOT NULL REFERENCES public.jurema_especialidades(codigo),
  status                    TEXT        NOT NULL DEFAULT 'fila'
                            CHECK (status IN ('fila','em_atendimento','encerrada')),
  especialista_id           UUID        REFERENCES public.jurema_especialistas(user_id),
  ultima_mensagem_at        TIMESTAMPTZ,
  ultima_inbound_at         TIMESTAMPTZ,
  janela_expira_at          TIMESTAMPTZ,  -- ultima_inbound_at + 24h
  reaviso_24h_enviado_at    TIMESTAMPTZ,
  encerrada_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jurema_conversas_status_esp
  ON public.jurema_conversas(status, especialidade);
CREATE INDEX IF NOT EXISTS idx_jurema_conversas_paciente
  ON public.jurema_conversas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_jurema_conversas_especialista
  ON public.jurema_conversas(especialista_id) WHERE status = 'em_atendimento';
CREATE INDEX IF NOT EXISTS idx_jurema_conversas_janela
  ON public.jurema_conversas(janela_expira_at) WHERE status = 'em_atendimento';

CREATE TRIGGER trg_jurema_conversas_updated_at
  BEFORE UPDATE ON public.jurema_conversas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Tabela: jurema_mensagens
-- Histórico completo. direction:
--   inbound  → paciente → JUREMA (autor = wa_id)
--   outbound → especialista/bot → paciente (autor_user_id = user_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurema_mensagens (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id       UUID        REFERENCES public.jurema_conversas(id) ON DELETE CASCADE,
  wa_id             TEXT        NOT NULL,
  direction         TEXT        NOT NULL CHECK (direction IN ('inbound','outbound')),
  autor_user_id     UUID        REFERENCES public.jurema_especialistas(user_id),
  tipo              TEXT        NOT NULL DEFAULT 'text'
                    CHECK (tipo IN ('text','image','audio','video','document','interactive','template','system')),
  content           TEXT,
  media_path        TEXT,                         -- caminho no bucket jurema-media
  media_mime        TEXT,
  turn_message_id   TEXT        UNIQUE,           -- id da Turn.io (evita duplicata em retries)
  status            TEXT        DEFAULT 'sent'
                    CHECK (status IN ('sent','delivered','read','failed','received')),
  raw               JSONB,                        -- payload Turn.io original, para debug
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jurema_mensagens_conversa
  ON public.jurema_mensagens(conversa_id, created_at);
CREATE INDEX IF NOT EXISTS idx_jurema_mensagens_wa_id
  ON public.jurema_mensagens(wa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jurema_mensagens_direction
  ON public.jurema_mensagens(direction);

-- ============================================================
-- Tabela: jurema_solicitacoes
-- Histórico permanente. Cobre tanto teleatendimento (modalidade 1)
-- quanto conversas textuais concluídas (modalidade 2).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurema_solicitacoes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id       UUID        NOT NULL REFERENCES public.jurema_pacientes(id),
  especialidade     TEXT        NOT NULL REFERENCES public.jurema_especialidades(codigo),
  modalidade        TEXT        NOT NULL CHECK (modalidade IN ('teleatendimento','texto')),
  status            TEXT        NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente','em_andamento','concluido','cancelado')),
  especialista_id   UUID        REFERENCES public.jurema_especialistas(user_id),
  conversa_id       UUID        REFERENCES public.jurema_conversas(id),
  observacoes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jurema_solicitacoes_status
  ON public.jurema_solicitacoes(status);
CREATE INDEX IF NOT EXISTS idx_jurema_solicitacoes_esp
  ON public.jurema_solicitacoes(especialidade);
CREATE INDEX IF NOT EXISTS idx_jurema_solicitacoes_paciente
  ON public.jurema_solicitacoes(paciente_id);

CREATE TRIGGER trg_jurema_solicitacoes_updated_at
  BEFORE UPDATE ON public.jurema_solicitacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- GRANTs para anon/authenticated/service_role
-- Conforme processTurn.md §4.6: DISABLE RLS não basta para a anon
-- key; grants explícitos são necessários para INSERT/UPDATE via REST.
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON public.jurema_especialidades TO anon, authenticated;

GRANT ALL ON public.jurema_pacientes        TO anon, authenticated, service_role;
GRANT ALL ON public.jurema_sessoes          TO anon, authenticated, service_role;
GRANT ALL ON public.jurema_especialistas    TO anon, authenticated, service_role;
GRANT ALL ON public.jurema_conversas        TO anon, authenticated, service_role;
GRANT ALL ON public.jurema_mensagens        TO anon, authenticated, service_role;
GRANT ALL ON public.jurema_solicitacoes     TO anon, authenticated, service_role;
