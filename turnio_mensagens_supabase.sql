-- ============================================================
-- Turn.io – Tabela de Mensagens WhatsApp
-- Projeto: IMIP
-- Supabase: https://uwwcrulhfrleqlmgmbcm.supabase.co
-- ============================================================

-- 1. Criar a tabela principal
CREATE TABLE IF NOT EXISTS mensagens_whatsapp (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id   TEXT        UNIQUE,                          -- ID da mensagem no Turn.io / Meta
  wa_id        TEXT        NOT NULL,                        -- Número do contato (ex: 5581999999999)
  contact_name TEXT,                                        -- Nome do contato (quando disponível)
  direction    TEXT        NOT NULL DEFAULT 'inbound'
                           CHECK (direction IN ('inbound', 'outbound')),
  type         TEXT        NOT NULL DEFAULT 'text',         -- text, image, audio, video, document, template, interactive, sticker, button, location, etc.
  content      TEXT,                                        -- Texto / caption / template name
  status       TEXT        CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'deleted')),
  timestamp    TIMESTAMPTZ,                                  -- Horário da mensagem (vindo do Turn.io)
  raw          JSONB,                                        -- Payload original completo
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_mensagens_wa_id        ON mensagens_whatsapp (wa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_direction     ON mensagens_whatsapp (direction);
CREATE INDEX IF NOT EXISTS idx_mensagens_status        ON mensagens_whatsapp (status);
CREATE INDEX IF NOT EXISTS idx_mensagens_timestamp     ON mensagens_whatsapp (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_wa_timestamp  ON mensagens_whatsapp (wa_id, timestamp DESC);

-- 3. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mensagens_updated_at ON mensagens_whatsapp;
CREATE TRIGGER trg_mensagens_updated_at
  BEFORE UPDATE ON mensagens_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 4. Desabilitar RLS para permitir uso com anon key (sem políticas)
--    Se quiser segurança adicional, remova esta linha e crie políticas RLS.
ALTER TABLE mensagens_whatsapp DISABLE ROW LEVEL SECURITY;

-- 5. (Opcional) Permissão explícita para o role anon caso RLS seja reativado
-- GRANT SELECT, INSERT, UPDATE ON mensagens_whatsapp TO anon;

-- ============================================================
-- Pronto! Cole este script no SQL Editor do Supabase.
-- URL do projeto: https://uwwcrulhfrleqlmgmbcm.supabase.co
-- ============================================================
