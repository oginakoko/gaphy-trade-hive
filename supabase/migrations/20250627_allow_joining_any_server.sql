-- Drop the existing policy that restricts joining to public servers, if it exists
DROP POLICY IF EXISTS "Users can join public servers" ON public.server_members_base;

-- Drop any existing policy with the same name before creating a new one
DROP POLICY IF EXISTS "Users can join any server with invite link" ON public.server_members_base;

-- Create a new policy to allow joining any server (public or private)
CREATE POLICY "Users can join any server with invite link"
ON public.server_members_base
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.servers
    WHERE id = server_members_base.server_id
  )
);

-- Keep the policy to allow viewing server members by everyone
DROP POLICY IF EXISTS "Server members are viewable by everyone" ON public.server_members_base;
CREATE POLICY "Server members are viewable by everyone"
ON public.server_members_base
FOR SELECT
USING (true);

-- Update policy to allow viewing server details for invite purposes
DROP POLICY IF EXISTS "Public servers are viewable by everyone." ON public.servers;
DROP POLICY IF EXISTS "Servers are viewable by everyone for invite purposes" ON public.servers;
CREATE POLICY "Servers are viewable by everyone for invite purposes"
ON public.servers
FOR SELECT
USING (true);
