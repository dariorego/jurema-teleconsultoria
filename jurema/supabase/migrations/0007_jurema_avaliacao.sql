-- JUREMA — Pesquisa de satisfação pós-atendimento.
-- Flow:
--   1. Especialista clica "Encerrar" -> rota envia lista 1..5 via Turn.io
--      e muda status para 'aguardando_avaliacao' (em vez de 'encerrada').
--   2. Paciente responde 1..5 (texto ou tap no list_reply).
--   3. Trigger captura a resposta, grava em jurema_conversas.avaliacao,
--      muda status para 'encerrada' e carimba encerrada_at.
--   4. Qualquer mensagem posterior do paciente retoma o fluxo normal de
--      nova teleconsultoria no n8n.

ALTER TABLE public.jurema_conversas
  DROP CONSTRAINT IF EXISTS jurema_conversas_status_check;

ALTER TABLE public.jurema_conversas
  ADD CONSTRAINT jurema_conversas_status_check
  CHECK (status IN ('fila','em_atendimento','aguardando_avaliacao','encerrada'));

ALTER TABLE public.jurema_conversas
  ADD COLUMN IF NOT EXISTS avaliacao SMALLINT
  CHECK (avaliacao IS NULL OR avaliacao BETWEEN 1 AND 5);

-- Trigger: ao inserir mensagem inbound com conteúdo 1..5, atribui avaliacao
-- à conversa em 'aguardando_avaliacao' do mesmo wa_id e encerra.
CREATE OR REPLACE FUNCTION public.jurema_capture_avaliacao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  rating   SMALLINT;
  target_id UUID;
  digit_match TEXT;
BEGIN
  IF NEW.direction <> 'inbound' OR NEW.content IS NULL THEN
    RETURN NEW;
  END IF;

  -- Aceita formatos: "3", "3 - Regular", "rating:3", "nota 3".
  digit_match := (regexp_match(NEW.content, '[1-5]'))[1];
  IF digit_match IS NULL THEN
    RETURN NEW;
  END IF;
  rating := digit_match::SMALLINT;

  -- 1) conversa do próprio message.conversa_id, se ainda aguardando
  IF NEW.conversa_id IS NOT NULL THEN
    SELECT id INTO target_id
      FROM public.jurema_conversas
     WHERE id = NEW.conversa_id
       AND status = 'aguardando_avaliacao';
  END IF;

  -- 2) fallback por wa_id (n8n pode ter criado uma conversa nova)
  IF target_id IS NULL THEN
    SELECT c.id INTO target_id
      FROM public.jurema_conversas c
      JOIN public.jurema_pacientes p ON p.id = c.paciente_id
     WHERE p.wa_id = NEW.wa_id
       AND c.status = 'aguardando_avaliacao'
     ORDER BY c.created_at DESC
     LIMIT 1;
  END IF;

  IF target_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.jurema_conversas
     SET avaliacao    = rating,
         status       = 'encerrada',
         encerrada_at = COALESCE(encerrada_at, NOW())
   WHERE id = target_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jurema_capture_avaliacao ON public.jurema_mensagens;
CREATE TRIGGER trg_jurema_capture_avaliacao
  AFTER INSERT ON public.jurema_mensagens
  FOR EACH ROW
  EXECUTE FUNCTION public.jurema_capture_avaliacao();
