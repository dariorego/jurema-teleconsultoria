-- ============================================================
-- Teleconsultoria IMIP – Tabelas Supabase
-- ============================================================

-- 1. Sessões ativas (estado da conversa em andamento)
--    Uma linha por número de WhatsApp.
--    Apagada/reiniciada quando o paciente começa de novo.
CREATE TABLE IF NOT EXISTS teleconsultoria_sessoes (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  wa_id            TEXT        NOT NULL UNIQUE,   -- número do paciente
  step             TEXT        NOT NULL DEFAULT 'aguardando_nome'
                               CHECK (step IN (
                                 'aguardando_nome',
                                 'aguardando_sobrenome',
                                 'aguardando_cpf',
                                 'aguardando_hospital',
                                 'aguardando_tipo',
                                 'concluido'
                               )),
  nome             TEXT,
  sobrenome        TEXT,
  cpf              TEXT,
  hospital         TEXT,
  tipo_atendimento TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Solicitações concluídas (histórico permanente)
CREATE TABLE IF NOT EXISTS solicitacoes_teleconsultoria (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  wa_id            TEXT        NOT NULL,
  nome             TEXT,
  sobrenome        TEXT,
  cpf              TEXT,
  hospital         TEXT,
  tipo_atendimento TEXT,
  status           TEXT        DEFAULT 'pendente'
                               CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_sessoes_wa_id       ON teleconsultoria_sessoes (wa_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_step        ON teleconsultoria_sessoes (step);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_wa_id  ON solicitacoes_teleconsultoria (wa_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes_teleconsultoria (status);

-- 4. Triggers updated_at
--    (a função set_updated_at() já foi criada pelo script turnio_mensagens_supabase.sql)
DROP TRIGGER IF EXISTS trg_sessoes_updated_at ON teleconsultoria_sessoes;
CREATE TRIGGER trg_sessoes_updated_at
  BEFORE UPDATE ON teleconsultoria_sessoes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_solicitacoes_updated_at ON solicitacoes_teleconsultoria;
CREATE TRIGGER trg_solicitacoes_updated_at
  BEFORE UPDATE ON solicitacoes_teleconsultoria
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Desabilitar RLS (anon key sem políticas)
ALTER TABLE teleconsultoria_sessoes        DISABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_teleconsultoria   DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- ⚠️  Pré-requisito: rodar primeiro turnio_mensagens_supabase.sql
--     (cria a função set_updated_at usada pelos triggers acima)
-- ============================================================
