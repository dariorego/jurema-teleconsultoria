-- ============================================================
-- Teleconsultoria IMIP – Atualização das tabelas
-- Rodar APÓS o teleconsultoria_supabase.sql inicial
-- ============================================================

-- Adicionar coluna forma_atendimento (videochamada / mensagens_texto)
ALTER TABLE teleconsultoria_sessoes       ADD COLUMN IF NOT EXISTS forma_atendimento TEXT;
ALTER TABLE solicitacoes_teleconsultoria  ADD COLUMN IF NOT EXISTS forma_atendimento TEXT;

-- Atualizar constraint do step para incluir o novo estado aguardando_forma
ALTER TABLE teleconsultoria_sessoes DROP CONSTRAINT IF EXISTS teleconsultoria_sessoes_step_check;
ALTER TABLE teleconsultoria_sessoes ADD CONSTRAINT teleconsultoria_sessoes_step_check
  CHECK (step IN (
    'aguardando_nome',
    'aguardando_sobrenome',
    'aguardando_cpf',
    'aguardando_hospital',
    'aguardando_forma',
    'aguardando_tipo',
    'concluido'
  ));
