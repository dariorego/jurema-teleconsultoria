-- JUREMA — Suporte a CRUD admin de usuários e categorias.
-- Adiciona soft-delete em jurema_especialidades (campo `ativo`) para que
-- categorias possam ser desativadas sem violar a FK NOT NULL em
-- jurema_conversas.especialidade.

ALTER TABLE public.jurema_especialidades
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill defensivo (caso DEFAULT não tenha pegado em rows existentes
-- por algum motivo; idempotente).
UPDATE public.jurema_especialidades SET ativo = TRUE WHERE ativo IS NULL;

-- Defesa em profundidade: admin pode tudo em jurema_especialidades.
-- (Rotas continuam usando service_role, mas a policy garante que se um
-- admin logado quiser ler/escrever via SDK do navegador, funciona.)
ALTER TABLE public.jurema_especialidades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "especialidades_select_auth" ON public.jurema_especialidades;
CREATE POLICY "especialidades_select_auth" ON public.jurema_especialidades
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "especialidades_admin_write" ON public.jurema_especialidades;
CREATE POLICY "especialidades_admin_write" ON public.jurema_especialidades
  FOR ALL TO authenticated
  USING (public.jurema_sou_admin())
  WITH CHECK (public.jurema_sou_admin());
