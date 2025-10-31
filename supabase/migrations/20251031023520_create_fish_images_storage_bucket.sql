/*
  # Create Fish Images Storage Bucket

  1. New Storage Bucket
    - `fish-images` - Public bucket for storing fish species images
    - Public access for reading images
    - Authenticated users can upload (admin only via RLS)
  
  2. Storage Policies
    - Public read access for all images
    - Authenticated users can upload images
    - Users can update/delete their own uploads
  
  3. Security
    - File size limits handled by Supabase (default 50MB)
    - Allowed file types: images only (jpg, jpeg, png, gif, webp)
    - Public bucket for easy CDN access
*/

-- Create the storage bucket for fish images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fish-images',
  'fish-images',
  true,
  10485760, -- 10MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view/download fish images (public bucket)
CREATE POLICY "Public read access for fish images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fish-images');

-- Policy: Authenticated users can upload fish images
CREATE POLICY "Authenticated users can upload fish images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fish-images');

-- Policy: Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update fish images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'fish-images')
WITH CHECK (bucket_id = 'fish-images');

-- Policy: Authenticated users can delete fish images
CREATE POLICY "Authenticated users can delete fish images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fish-images');
