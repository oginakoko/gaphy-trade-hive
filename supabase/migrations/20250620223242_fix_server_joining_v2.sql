CREATE POLICY "Users can join public servers"
ON public.server_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.servers
    WHERE id = server_members.server_id
    AND is_public = true
  )
);

CREATE POLICY "Server members are viewable by everyone"
ON public.server_members
FOR SELECT
USING (true);