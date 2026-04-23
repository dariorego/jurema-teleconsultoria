-- JUREMA — Fix complementar de RLS: SELECT para anon (usado pelo N8N)
--
-- Bug: migration 0005 adicionou INSERT/UPDATE policies para anon, mas
-- não criou SELECT. O N8N não conseguia LER jurema_conversas/mensagens
-- (por exemplo, "Buscar Conversa Ativa" retornava vazio mesmo com
-- dados na tabela).

DROP POLICY IF EXISTS "conversas_anon_select" ON public.jurema_conversas;
DROP POLICY IF EXISTS "mensagens_anon_select" ON public.jurema_mensagens;

CREATE POLICY "conversas_anon_select" ON public.jurema_conversas
  FOR SELECT TO anon USING (TRUE);

CREATE POLICY "mensagens_anon_select" ON public.jurema_mensagens
  FOR SELECT TO anon USING (TRUE);
