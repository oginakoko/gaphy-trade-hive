-- PATCH: Fix infinite recursion in RLS policies for server_members_base

-- 1. Drop all existing policies on server_members_base
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'server_members_base' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.server_members_base', pol.policyname);
  END LOOP;
END $$;

-- 2. Create safe, non-recursive policies for regular users
CREATE POLICY server_members_select ON public.server_members_base
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY server_members_insert ON public.server_members_base
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY server_members_update ON public.server_members_base
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY server_members_delete ON public.server_members_base
  FOR DELETE USING (user_id = auth.uid());

-- 3. Allow server owners to manage all memberships (select, insert, update, delete)
CREATE POLICY server_owners_manage_members ON public.server_members_base
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = server_members_base.server_id
        AND s.owner_id = auth.uid()
    )
  );

-- 4. Done! All users can manage their own memberships; server owners can manage all memberships for their servers.
