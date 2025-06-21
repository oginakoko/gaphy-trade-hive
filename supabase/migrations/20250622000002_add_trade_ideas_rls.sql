-- Enable RLS for trade_ideas table
ALTER TABLE public.trade_ideas ENABLE ROW LEVEL SECURITY;

-- Everyone can view trade ideas
CREATE POLICY "trade_ideas_select_policy"
ON public.trade_ideas
FOR SELECT
USING (true);

-- Only owner can insert
CREATE POLICY "trade_ideas_insert_policy"
ON public.trade_ideas
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only owner can update
CREATE POLICY "trade_ideas_update_policy"
ON public.trade_ideas
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS for servers table
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

-- Everyone can view public servers
CREATE POLICY "servers_select_public_policy"
ON public.servers
FOR SELECT
USING (is_public = true);

-- Members can view private servers they belong to
CREATE POLICY "servers_select_private_policy"
ON public.servers
FOR SELECT
USING (
    is_public = false AND
    EXISTS (
        SELECT 1 FROM server_members 
        WHERE server_id = servers.id AND user_id = auth.uid()
    )
);

-- Only owner can insert servers
CREATE POLICY "servers_insert_policy"
ON public.servers
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Only owner can update servers
CREATE POLICY "servers_update_policy"
ON public.servers
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);