-- Moderators can delete any message except admin/owner's; admins/owners can delete any
CREATE POLICY "Moderators can delete non-admin messages"
ON public.server_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.server_members AS sm
    WHERE sm.server_id = server_messages.server_id
      AND sm.user_id = auth.uid()
      AND (
        sm.role IN ('admin', 'owner')
        OR (
          sm.role = 'moderator'
          AND NOT EXISTS (
            SELECT 1 FROM public.server_members AS author
            WHERE author.server_id = server_messages.server_id
              AND author.user_id = server_messages.user_id
              AND author.role IN ('admin', 'owner')
          )
        )
      )
  )
);
