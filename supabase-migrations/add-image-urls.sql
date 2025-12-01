-- Add image_urls column to helpdesk_tickets table
-- This stores an array of URLs pointing to images in Supabase Storage

ALTER TABLE helpdesk_tickets
ADD COLUMN image_urls TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN helpdesk_tickets.image_urls IS 'Array of image URLs from Supabase Storage (ticket images bucket)';
