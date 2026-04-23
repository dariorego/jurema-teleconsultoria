-- JUREMA — Seed de desenvolvimento (ajuste os user_id após criar no Supabase Auth).
--
-- Passo a passo:
--   1. No Supabase Studio → Authentication → Users → "Add user" (envia email+senha)
--      para cada perfil: admin, medico@imip, psicologo@imip, nutricao@imip, social@imip
--   2. Copie o UUID de cada usuário criado.
--   3. Substitua os placeholders abaixo e rode este arquivo.
--
-- Alternativa: rodar este seed sem usuários e inserir manualmente depois.

INSERT INTO public.jurema_especialistas (user_id, nome, especialidade, role) VALUES
  ('45475e58-620b-4182-ade9-c0f24730b21e', 'Admin IMIP',           NULL,                'admin'),
  ('86c339ed-e172-40e5-ae27-3fd4f82c8c68', 'Dra. Médica Teste',    'medico',            'especialista'),
  ('81185c3f-ac57-4019-ad2d-9a659cbd30ec', 'Psicóloga Teste',      'psicologo',         'especialista'),
  ('808c42ff-d951-4d7a-ad50-2b3b969d3e11', 'Nutricionista Teste',  'nutricao',          'especialista'),
  ('d6de291b-30f4-46b4-b2a2-8c65a603f881', 'Assist. Social Teste', 'assistente_social', 'especialista')
ON CONFLICT (user_id) DO NOTHING;
