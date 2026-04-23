-- JUREMA — Storage para mídias (áudio, imagem, vídeo, documento)
-- Bucket privado; acesso via signed URL gerado server-side.

INSERT INTO storage.buckets (id, name, public)
  VALUES ('jurema-media', 'jurema-media', FALSE)
  ON CONFLICT (id) DO NOTHING;

-- Só authenticated lê (via signed URL); só service_role escreve (API Next.js
-- baixa mídia inbound da Turn.io e faz upload).
CREATE POLICY "jurema_media_read_auth"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'jurema-media');
