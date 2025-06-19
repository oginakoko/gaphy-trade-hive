-- Drop ALL existing policies using a more thorough approach
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

-- Create index for faster admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- Add missing indexes for user_follows if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_follows_combined ON public.user_follows(follower_id, following_id);

-- Simple SELECT policy for profiles - allows all authenticated users to view profiles
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Messages SELECT policy - users can see messages they're part of or if they're admin
CREATE POLICY "messages_select_policy"
ON public.private_messages
FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR (
        SELECT is_admin FROM profiles WHERE id = auth.uid()
    ) = true
    OR is_broadcast = true
);

-- Separate policies for direct messages and broadcasts
CREATE POLICY "messages_insert_direct"
ON public.private_messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND is_broadcast = false
    AND (
        -- Allow if sender is admin
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
        OR
        -- Allow if recipient is admin
        EXISTS (SELECT 1 FROM profiles WHERE id = recipient_id AND is_admin = true)
        OR
        -- Allow if mutual follow exists
        EXISTS (SELECT 1 FROM user_follows WHERE follower_id = auth.uid() AND following_id = recipient_id)
        AND EXISTS (SELECT 1 FROM user_follows WHERE follower_id = recipient_id AND following_id = auth.uid())
    )
);

-- Separate broadcast policy
CREATE POLICY "messages_insert_broadcast"
ON public.private_messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND is_broadcast = true
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Messages UPDATE policy (mark as read)
CREATE POLICY "messages_update_policy"
ON public.private_messages
FOR UPDATE
TO authenticated
USING (
    auth.uid() = recipient_id
    OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
    -- Only allow updating is_read field
    (auth.uid() = recipient_id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
    AND is_read = true
);

-- Add UNIQUE constraint to prevent duplicate follows if not exists
DO $$ 
BEGIN
    ALTER TABLE public.user_follows ADD CONSTRAINT user_follows_unique_follow UNIQUE (follower_id, following_id);
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;
