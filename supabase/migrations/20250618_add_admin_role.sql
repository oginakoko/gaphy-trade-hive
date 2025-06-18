-- Add is_admin column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Grant initial admin status (replace with your admin user's ID)
UPDATE public.profiles 
SET is_admin = true 
WHERE id = '73938002-b3f8-4444-ad32-6a46cbf8e075'; -- Replace with your actual admin user ID
