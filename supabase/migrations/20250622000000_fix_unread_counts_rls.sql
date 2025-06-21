-- Migration to add RLS policies for unread_message_counts table
-- Fixes "new row violates row-level security policy" error when sending messages

-- 1. Drop existing policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'unread_message_counts') THEN
    EXECUTE 'DROP POLICY IF EXISTS unread_counts_select ON public.unread_message_counts';
    EXECUTE 'DROP POLICY IF EXISTS unread_counts_insert ON public.unread_message_counts';
    EXECUTE 'DROP POLICY IF EXISTS unread_counts_update ON public.unread_message_counts';
    EXECUTE 'DROP POLICY IF EXISTS unread_counts_delete ON public.unread_message_counts';
  END IF;
END $$;

-- 2. Create new policies
CREATE POLICY unread_counts_select ON public.unread_message_counts
  FOR SELECT USING (
    -- Users can see their own unread counts
    user_id = auth.uid() OR
    -- Or counts related to messages they sent/received
    EXISTS (
      SELECT 1 FROM private_messages 
      WHERE private_messages.id = unread_message_counts.private_message_id 
      AND (private_messages.sender_id = auth.uid() OR private_messages.receiver_id = auth.uid())
    )
  );

CREATE POLICY unread_counts_insert ON public.unread_message_counts
  FOR INSERT WITH CHECK (
    -- Only allow inserts for messages the user sent
    EXISTS (
      SELECT 1 FROM private_messages 
      WHERE private_messages.id = unread_message_counts.private_message_id 
      AND private_messages.sender_id = auth.uid()
    )
  );

CREATE POLICY unread_counts_update ON public.unread_message_counts
  FOR UPDATE USING (
    -- Users can only update their own counts
    user_id = auth.uid()
  );

CREATE POLICY unread_counts_delete ON public.unread_message_counts
  FOR DELETE USING (
    -- Users can only delete their own counts
    user_id = auth.uid()
  );

-- 3. Enable RLS if not already enabled
ALTER TABLE public.unread_message_counts ENABLE ROW LEVEL SECURITY;
