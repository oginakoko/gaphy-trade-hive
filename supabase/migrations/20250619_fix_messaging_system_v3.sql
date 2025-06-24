-- Drop ALL existing policies using a thorough approach
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'private_messages'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.private_messages', pol.policyname);
    END LOOP;
    
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- Add foreign key constraints to private_messages if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'private_messages_sender_id_fkey') THEN
        ALTER TABLE public.private_messages
        ADD CONSTRAINT private_messages_sender_id_fkey
        FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'private_messages_recipient_id_fkey') THEN
        ALTER TABLE public.private_messages
        ADD CONSTRAINT private_messages_recipient_id_fkey
        FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- First ensure the admin user has admin privileges
UPDATE public.profiles
SET is_admin = true
WHERE id = '73938002-b3f8-4444-ad32-6a46cbf8e075';

-- Create index for faster admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- Add missing indexes for user_follows if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_follows_combined ON public.user_follows(follower_id, following_id);

-- Simple SELECT policy for profiles with unique name
CREATE POLICY "profiles_select_20250619_v1"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Messages SELECT policy with unique name
CREATE POLICY "pm_select_20250619_v1"
ON public.private_messages
FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Messages INSERT policy with unique name
CREATE POLICY "pm_insert_20250619_v1"
ON public.private_messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND (
        -- Admin can send any message (direct or broadcast)
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
        OR
        -- Non-admin users can only send direct messages to mutual followers or admins
        (
            NOT is_broadcast
            AND
            (
                -- Recipient is admin
                EXISTS (SELECT 1 FROM profiles WHERE id = recipient_id AND is_admin = true)
                OR
                -- Mutual follow exists
                EXISTS (SELECT 1 FROM user_follows WHERE follower_id = auth.uid() AND following_id = recipient_id)
                AND EXISTS (SELECT 1 FROM user_follows WHERE follower_id = recipient_id AND following_id = auth.uid())
            )
        )
    )
);

-- Messages UPDATE policy with unique name
CREATE POLICY "pm_update_20250619_v1"
ON public.private_messages
FOR UPDATE
TO authenticated
USING (
    auth.uid() = recipient_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
)
WITH CHECK (
    (auth.uid() = recipient_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
    AND is_read = true
);

-- Add UNIQUE constraint to prevent duplicate follows if not exists
DO $$
BEGIN
    ALTER TABLE public.user_follows ADD CONSTRAINT user_follows_unique_follow UNIQUE (follower_id, following_id);
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;
