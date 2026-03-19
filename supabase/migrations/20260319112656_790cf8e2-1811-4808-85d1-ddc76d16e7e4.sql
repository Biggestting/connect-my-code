
-- Create the event-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- Allow public read access
CREATE POLICY "Public can view event images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'event-images');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own event images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own event images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);
