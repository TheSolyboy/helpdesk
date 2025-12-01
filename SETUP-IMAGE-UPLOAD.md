# Image Upload Feature Setup Guide

This guide will help you complete the setup for the image upload feature in your helpdesk application.

## Overview

The image upload feature allows users to attach images when submitting support tickets. Images are stored in Supabase Storage and displayed in the admin/agent dashboard for better support.

## Prerequisites

- Supabase project with a bucket named "ticket images" already created
- Access to Supabase SQL Editor
- Admin access to your Supabase project

## Setup Steps

### 1. Run Database Migration

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Add image_urls column to helpdesk_tickets table
ALTER TABLE helpdesk_tickets
ADD COLUMN image_urls TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN helpdesk_tickets.image_urls IS 'Array of image URLs from Supabase Storage (ticket images bucket)';
```

**File location:** `supabase-migrations/add-image-urls.sql`

### 2. Configure Storage Bucket Policies

In your Supabase Dashboard, go to **Storage > Policies** and execute the following SQL:

```sql
-- Policy 1: Allow anyone to upload images (INSERT)
CREATE POLICY "Allow public upload to ticket images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'ticket images');

-- Policy 2: Allow authenticated users (staff) to view images (SELECT)
CREATE POLICY "Allow authenticated users to view ticket images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'ticket images');
```

**File location:** `supabase-migrations/storage-bucket-policies.sql`

### 3. Verify Bucket Configuration

In Supabase Dashboard > Storage > ticket images:

- **Public:** Should be `No` (controlled by policies)
- **File size limit:** Recommended 5MB per file
- **Allowed MIME types:**
  - image/jpeg
  - image/png
  - image/gif
  - image/webp

### 4. Optional: Allow Public Image Viewing

If you want ticket creators (non-authenticated users) to view their uploaded images, add this additional policy:

```sql
CREATE POLICY "Allow public to view ticket images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ticket images');
```

**Note:** This is optional. By default, only authenticated staff can view images.

## Testing the Feature

### Test Image Upload

1. Go to your application homepage
2. Fill out a support ticket form
3. Click "Add images" and select one or more images (max 5MB each)
4. You should see image previews appear
5. Click the X button on a preview to remove an image
6. Submit the ticket

### Test Image Viewing

1. Log in to the admin or agent dashboard
2. Find the ticket you just created
3. You should see the "Attachments" section with thumbnail images
4. Click on a thumbnail to view the full-size image in a lightbox
5. Click the X or outside the image to close the lightbox

## Features Implemented

### User-Facing Features
- ✅ Multiple image upload support
- ✅ Image preview before submission
- ✅ Remove images before submission
- ✅ File type validation (images only)
- ✅ File size validation (5MB max per image)
- ✅ Visual feedback for upload errors

### Admin/Agent Dashboard Features
- ✅ Display image thumbnails in ticket cards
- ✅ Image count badge
- ✅ Click to view full-size images
- ✅ Lightbox/modal for image viewing
- ✅ Support for multiple images per ticket

### Technical Implementation
- ✅ Images stored in Supabase Storage
- ✅ Image URLs stored in database (TEXT[] array)
- ✅ Row Level Security policies for controlled access
- ✅ Client-side image upload handling
- ✅ Responsive image grid layout
- ✅ TypeScript type safety

## Troubleshooting

### Images not uploading
1. Check browser console for errors
2. Verify bucket name is exactly "ticket images"
3. Verify storage policies are applied
4. Check file size (must be under 5MB)
5. Check file type (must be an image)

### Images not displaying in dashboard
1. Check if `image_urls` column exists in `helpdesk_tickets` table
2. Verify RLS policies allow authenticated users to SELECT from storage
3. Check browser console for CORS or network errors
4. Verify the ticket actually has images (check database)

### Public users can't upload
1. Check the INSERT policy for public users
2. Verify bucket is not set to "private" mode
3. Check Supabase project quotas

### Storage quota exceeded
1. Go to Supabase Dashboard > Settings > Billing
2. Check storage usage
3. Consider upgrading plan or cleaning old images

## File Changes Summary

### Modified Files
- `lib/types.ts` - Added `image_urls` to Ticket and TicketFormData interfaces
- `components/ticket-form.tsx` - Added image upload UI and logic
- `app/api/tickets/route.ts` - Added `image_urls` handling in POST endpoint
- `components/ticket-list.tsx` - Added image display and lightbox

### New Files
- `supabase-migrations/add-image-urls.sql` - Database schema migration
- `supabase-migrations/storage-bucket-policies.sql` - Storage policies
- `SETUP-IMAGE-UPLOAD.md` - This setup guide

## Next Steps

1. Run the database migration (Step 1)
2. Configure storage policies (Step 2)
3. Verify bucket settings (Step 3)
4. Test the feature (see Testing section)
5. Deploy to production

## Production Deployment Notes

When deploying to production:

1. Ensure environment variables are set correctly
2. Run migrations on production database
3. Configure storage policies on production Supabase project
4. Test image upload in production environment
5. Monitor storage usage and costs

## Support

If you encounter issues:
- Check Supabase logs in Dashboard > Logs
- Review browser console for client-side errors
- Check network tab for failed API requests
- Verify all migrations were applied successfully
