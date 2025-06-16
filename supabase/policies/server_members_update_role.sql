-- Allow only admins/owners to update member roles
CREATE POLICY "Admins can update member roles"
ON public.server_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.server_members AS sm
    WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('admin', 'owner')
  )
);
