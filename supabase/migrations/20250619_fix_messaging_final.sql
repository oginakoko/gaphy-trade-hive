-- Drop ALL existing policies using a thorough approach
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename IN ('private_messages', 'unread_message_counts', 'profiles', 'user_follows', 'message_attachments')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Make sure RLS is enabled on all relevant tables
DO $$ 
BEGIN
    ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.unread_message_counts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
END $$;

-- First ensure the admin user has admin privileges
UPDATE public.profiles 
SET is_admin = true 
WHERE id = '73938002-b3f8-4444-ad32-6a46cbf8e075';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_user_follows_combined ON public.user_follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON public.private_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_broadcast ON public.private_messages(is_broadcast) WHERE is_broadcast = true;

-- Simple profiles policy - everyone can view profiles
CREATE POLICY "profiles_select_20250619_final"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Messages SELECT policy - users can view messages they're part of or if they're admin
CREATE POLICY "pm_select_20250619_final"
ON public.private_messages
FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR is_broadcast = true
);

-- Messages INSERT policy - direct messages
CREATE POLICY "pm_insert_direct_20250619_final"
ON public.private_messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND NOT is_broadcast
    AND (
        -- Admin can message anyone
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
        OR
        -- Anyone can message admins (support chat)
        EXISTS (SELECT 1 FROM profiles WHERE id = recipient_id AND is_admin = true)
        OR
        -- Mutual followers can message each other
        (
            EXISTS (SELECT 1 FROM user_follows WHERE follower_id = auth.uid() AND following_id = recipient_id)
            AND 
            EXISTS (SELECT 1 FROM user_follows WHERE follower_id = recipient_id AND following_id = auth.uid())
        )
    )
);

-- Messages INSERT policy - broadcasts (admin only)
CREATE POLICY "pm_insert_broadcast_20250619_final"
ON public.private_messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND is_broadcast = true
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Messages UPDATE policy (for marking messages as read)
CREATE POLICY "pm_update_20250619_final"
ON public.private_messages
FOR UPDATE
TO authenticated
USING (
    -- Can update if you're the recipient or admin
    auth.uid() = recipient_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
)
WITH CHECK (
    -- Can only update is_read field
    (auth.uid() = recipient_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
    AND is_read = true
);

-- Message attachments policies
CREATE POLICY "attachments_select_20250619_final"
ON public.message_attachments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.private_messages
        WHERE id = message_attachments.message_id
        AND (
            sender_id = auth.uid()
            OR recipient_id = auth.uid()
            OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
        )
    )
);

CREATE POLICY "attachments_insert_20250619_final"
ON public.message_attachments
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.private_messages
        WHERE id = message_attachments.message_id
        AND sender_id = auth.uid()
    )
);

-- Unread counts policies
CREATE POLICY "unread_counts_select_20250619_final"
ON public.unread_message_counts
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "unread_counts_insert_20250619_final"
ON public.unread_message_counts
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "unread_counts_update_20250619_final"
ON public.unread_message_counts
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- User follows policies
CREATE POLICY "follows_select_20250619_final"
ON public.user_follows
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "follows_insert_20250619_final"
ON public.user_follows
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_20250619_final"
ON public.user_follows
FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- Ensure triggers exist for unread counts and updated_at
DROP TRIGGER IF EXISTS on_new_message ON private_messages;
DROP TRIGGER IF EXISTS update_messages_updated_at ON private_messages;
DROP TRIGGER IF EXISTS auto_follow_admin ON profiles;

-- Function for updating unread counts
CREATE OR REPLACE FUNCTION update_unread_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT NEW.is_broadcast THEN
        INSERT INTO public.unread_message_counts (user_id, unread_count)
        VALUES (NEW.recipient_id, 1)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            unread_count = unread_message_counts.unread_count + 1,
            last_checked_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for auto-following admins
CREATE OR REPLACE FUNCTION auto_follow_admin_for_new_users()
RETURNS TRIGGER AS $$
DECLARE
    admin_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(id)
    INTO admin_ids
    FROM public.profiles
    WHERE is_admin = true;
    
    IF admin_ids IS NOT NULL THEN
        -- New user follows admins (for support chat)
        INSERT INTO public.user_follows (follower_id, following_id)
        SELECT NEW.id, admin_id
        FROM UNNEST(admin_ids) AS admin_id
        ON CONFLICT DO NOTHING;
        
        -- Admins follow new user (so they can message back)
        INSERT INTO public.user_follows (follower_id, following_id)
        SELECT admin_id, NEW.id
        FROM UNNEST(admin_ids) AS admin_id
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON private_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_follow_admin_for_new_users();

CREATE TRIGGER on_new_message
    AFTER INSERT ON private_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_unread_message_count();
