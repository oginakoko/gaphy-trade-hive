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
        WHERE tablename = 'unread_message_counts'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.unread_message_counts', pol.policyname);
    END LOOP;
END $$;

-- First ensure RLS is enabled
ALTER TABLE public.unread_message_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Messages policies (with unique names)
CREATE POLICY "pm_select_20250619_v4"
ON public.private_messages
FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR is_broadcast = true
);

CREATE POLICY "pm_insert_direct_20250619_v4"
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
        -- Anyone can message admins
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

CREATE POLICY "pm_insert_broadcast_20250619_v4"
ON public.private_messages
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND is_broadcast = true
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Unread counts policies (with unique names)
CREATE POLICY "unread_counts_select_20250619_v4"
ON public.unread_message_counts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "unread_counts_insert_20250619_v4"
ON public.unread_message_counts
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "unread_counts_update_20250619_v4"
ON public.unread_message_counts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure triggers for unread counts exist
DROP TRIGGER IF EXISTS on_new_message ON private_messages;

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

CREATE TRIGGER on_new_message
    AFTER INSERT ON private_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_unread_message_count();
INSERT INTO public.unread_message_counts (user_id, unread_count)
VALUES ('73938002-b3f8-4444-ad32-6a46cbf8e075', 0)
ON CONFLICT (user_id) DO NOTHING;
