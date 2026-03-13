-- Add UNIQUE constraint to blog_post.slug to prevent duplicate URLs
CREATE UNIQUE INDEX IF NOT EXISTS blog_post_slug_unique ON blog_post(slug);
