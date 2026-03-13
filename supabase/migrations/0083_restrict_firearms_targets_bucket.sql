-- ============================================================================
-- 0076: Restrict firearms-targets bucket to image types + 5MB limit
-- ============================================================================

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  file_size_limit = 5242880  -- 5MB
WHERE id = 'firearms-targets';
