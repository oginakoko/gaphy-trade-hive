-- === PATCH: Ensure avatar_url and created_at columns exist and are valid ===

-- 1. Add avatar_url to profiles if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 2. Fill missing avatar_url with default
UPDATE public.profiles SET avatar_url = 'https://ui-avatars.com/api/?name=' || username WHERE avatar_url IS NULL OR avatar_url = '';

-- 3. Add created_at to profiles if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='profiles' AND column_name='created_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. Fill missing created_at in profiles
UPDATE public.profiles SET created_at = NOW() WHERE created_at IS NULL;

-- 5. Add created_at to servers if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='servers' AND column_name='created_at'
    ) THEN
        ALTER TABLE public.servers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 6. Fill missing created_at in servers
UPDATE public.servers SET created_at = NOW() WHERE created_at IS NULL;

-- 7. Enforce NOT NULL on created_at and avatar_url
ALTER TABLE public.profiles ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN avatar_url SET NOT NULL;
ALTER TABLE public.servers ALTER COLUMN created_at SET NOT NULL;

-- 8. Remove orphaned servers, server_members, and server_messages (if table exists)
DELETE FROM public.servers WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM public.profiles);
DELETE FROM public.server_members WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM public.profiles) OR server_id IS NULL OR server_id NOT IN (SELECT id FROM public.servers);
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name='server_messages'
    ) THEN
        DELETE FROM public.server_messages WHERE server_id IS NULL OR server_id NOT IN (SELECT id FROM public.servers);
    END IF;
END $$;

-- 9. Add/repair foreign key constraints
ALTER TABLE public.servers DROP CONSTRAINT IF EXISTS servers_owner_id_fkey;
ALTER TABLE public.servers ADD CONSTRAINT servers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.server_members DROP CONSTRAINT IF EXISTS server_members_user_id_fkey;
ALTER TABLE public.server_members ADD CONSTRAINT server_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.server_members DROP CONSTRAINT IF EXISTS server_members_server_id_fkey;
ALTER TABLE public.server_members ADD CONSTRAINT server_members_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;
-- === END PATCH ===
