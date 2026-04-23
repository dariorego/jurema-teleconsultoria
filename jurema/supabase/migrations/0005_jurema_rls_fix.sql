-- JUREMA — Fix RLS para writes do N8N (idempotente)
--
-- Bug: migration 0002 ativou RLS nas tabelas jurema_* e criou apenas
-- policies de SELECT. O N8N escreve usando a anon key (sem JWT), então
-- os INSERT/UPDATE/DELETE são bloqueados com erro 42501.

DROP POLICY IF EXISTS "sessoes_anon_all"        ON public.jurema_sessoes;
DROP POLICY IF EXISTS "pacientes_anon_all"      ON public.jurema_pacientes;
DROP POLICY IF EXISTS "conversas_anon_insert"   ON public.jurema_conversas;
DROP POLICY IF EXISTS "conversas_anon_update"   ON public.jurema_conversas;
DROP POLICY IF EXISTS "mensagens_anon_insert"   ON public.jurema_mensagens;
DROP POLICY IF EXISTS "solicitacoes_anon_all"   ON public.jurema_solicitacoes;

CREATE POLICY "sessoes_anon_all" ON public.jurema_sessoes
  FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "pacientes_anon_all" ON public.jurema_pacientes
  FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "conversas_anon_insert" ON public.jurema_conversas
  FOR INSERT TO anon WITH CHECK (TRUE);

CREATE POLICY "conversas_anon_update" ON public.jurema_conversas
  FOR UPDATE TO anon USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "mensagens_anon_insert" ON public.jurema_mensagens
  FOR INSERT TO anon WITH CHECK (TRUE);

CREATE POLICY "solicitacoes_anon_all" ON public.jurema_solicitacoes
  FOR ALL TO anon USING (TRUE) WITH CHECK (TRUE);
