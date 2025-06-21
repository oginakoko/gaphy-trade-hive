-- Migration to add proper RLS policies for unread_message_counts table
-- Corrected to match actual table structure (no message_id foreign key)

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

-- 2. Create new policies based on actual table columns
CREATE POLICY unread_counts_select ON public.unread_message_counts
  FOR SELECT USING (
    -- Users can only view their own unread counts
    user_id = auth.uid()
  );

CREATE POLICY unread_counts_insert ON public.unread_message_counts
  FOR INSERT WITH CHECK (
    -- Users can create records for themselves
    user_id = auth.uid()
    -- OR allow the message trigger to create records for recipients
    OR (
      EXISTS (
        SELECT 1 FROM private_messages
        WHERE recipient_id = user_id
        AND sender_id = auth.uid()
      )
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
