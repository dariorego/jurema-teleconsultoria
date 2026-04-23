-- JUREMA — Row Level Security
--
-- Modelo:
--   especialista → lê/escreve em conversas e mensagens da SUA especialidade
--   admin        → acesso total
--   anon/N8N     → usa service_role key (bypassa RLS); não há acesso anon direto
--                   às tabelas sensíveis pelo cliente.
--
-- IMPORTANTE: o N8N continua escrevendo com a SERVICE_ROLE_KEY (bypassa RLS).
-- A UI Next.js server-side (API routes) também pode usar service_role quando
-- precisar bypassar (ex: puxar conversa). Já o cliente do browser usa a sessão
-- autenticada (anon key + JWT do usuário) e respeita as policies abaixo.

-- ============================================================
-- Helper: minha especialidade (do JWT authenticated)
-- ============================================================
CREATE OR REPLACE FUNCTION public.jurema_minha_especialidade()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT especialidade
    FROM public.jurema_especialistas
   WHERE user_id = auth.uid()
     AND ativo = TRUE
   LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.jurema_sou_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jurema_especialistas
     WHERE user_id = auth.uid()
       AND role = 'admin'
       AND ativo = TRUE
  )
$$;

GRANT EXECUTE ON FUNCTION public.jurema_minha_especialidade() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jurema_sou_admin()           TO authenticated;

-- ============================================================
-- jurema_especialistas: cada user vê o próprio registro; admin vê todos.
-- ============================================================
ALTER TABLE public.jurema_especialistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "especialista_self_select" ON public.jurema_especialistas
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.jurema_sou_admin());

CREATE POLICY "admin_all" ON public.jurema_especialistas
  FOR ALL TO authenticated
  USING (public.jurema_sou_admin())
  WITH CHECK (public.jurema_sou_admin());

-- ============================================================
-- jurema_conversas: especialista vê da sua especialidade; admin tudo.
-- ============================================================
ALTER TABLE public.jurema_conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversas_select_por_especialidade" ON public.jurema_conversas
  FOR SELECT TO authenticated
  USING (
    public.jurema_sou_admin()
    OR especialidade = public.jurema_minha_especialidade()
  );

CREATE POLICY "conversas_update_por_especialidade" ON public.jurema_conversas
  FOR UPDATE TO authenticated
  USING (
    public.jurema_sou_admin()
    OR especialidade = public.jurema_minha_especialidade()
  )
  WITH CHECK (
    public.jurema_sou_admin()
    OR especialidade = public.jurema_minha_especialidade()
  );

-- ============================================================
-- jurema_mensagens: herda da conversa (join via RLS).
-- ============================================================
ALTER TABLE public.jurema_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mensagens_select_via_conversa" ON public.jurema_mensagens
  FOR SELECT TO authenticated
  USING (
    public.jurema_sou_admin()
    OR EXISTS (
      SELECT 1 FROM public.jurema_conversas c
       WHERE c.id = jurema_mensagens.conversa_id
         AND c.especialidade = public.jurema_minha_especialidade()
    )
  );

-- inserts de outbound vêm da API server-side com service_role;
-- não há INSERT policy para authenticated (só bypass via service_role).

-- ============================================================
-- jurema_pacientes, jurema_sessoes, jurema_solicitacoes:
-- leitura para authenticated (para popular UI do chat).
-- Escrita só via service_role (N8N/API).
-- ============================================================
ALTER TABLE public.jurema_pacientes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurema_sessoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurema_solicitacoes  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pacientes_select_auth" ON public.jurema_pacientes
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "sessoes_select_auth" ON public.jurema_sessoes
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "solicitacoes_select_por_especialidade" ON public.jurema_solicitacoes
  FOR SELECT TO authenticated
  USING (
    public.jurema_sou_admin()
    OR especialidade = public.jurema_minha_especialidade()
  );

-- ============================================================
-- Realtime: publicar mudanças para o cliente autenticado
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.jurema_conversas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jurema_mensagens;
