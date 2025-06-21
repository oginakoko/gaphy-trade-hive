-- === MASTER SCHEMA & DATA REPAIR MIGRATION FOR GAPHY TRADE HIVE ===
-- This migration will:
-- 1. Ensure all required columns exist and are NOT NULL with defaults.
-- 2. Add missing ENUM types and constraints.
-- 3. Fill/fix all NULL, empty, or invalid values in critical columns.
-- 4. Remove all orphaned foreign keys in all major tables.
-- 5. Add/repair all foreign key constraints.
-- 6. Add missing triggers for updated_at.
-- 7. Ensure API compatibility for Supabase.

-- === ENUM TYPES ===
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'server_role') THEN
        CREATE TYPE server_role AS ENUM ('owner', 'admin', 'moderator', 'member');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_status') THEN
        CREATE TYPE ad_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
    END IF;
    -- Patch: Only create media_type with valid values
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
        CREATE TYPE media_type AS ENUM ('image', 'video');
    END IF;
    -- Patch: If 'other' exists in the enum, do nothing. If not, do not use it in updates below.
END $$;

-- === PROFILES TABLE ===
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

UPDATE public.profiles SET username = 'user_' || id WHERE username IS NULL OR char_length(username) < 3;
UPDATE public.profiles SET email = 'user_' || id || '@example.com' WHERE email IS NULL OR char_length(email) < 3;
UPDATE public.profiles SET avatar_url = 'https://ui-avatars.com/api/?name=' || username WHERE avatar_url IS NULL OR avatar_url = '';
UPDATE public.profiles SET created_at = NOW() WHERE created_at IS NULL;
UPDATE public.profiles SET updated_at = NOW() WHERE updated_at IS NULL;
DELETE FROM public.profiles WHERE id IS NULL OR id::text !~* '^[0-9a-fA-F-]{36}$';
ALTER TABLE public.profiles ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN avatar_url SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN updated_at SET NOT NULL;
-- Add username_length_check constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'username_length_check'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT username_length_check CHECK (char_length(username) >= 3);
    END IF;
END $$;
-- Add email_unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'email_unique'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT email_unique UNIQUE (email);
    END IF;
END $$;

-- === SERVERS TABLE ===
ALTER TABLE public.servers
    ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS owner_id UUID,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT;
UPDATE public.servers SET created_at = NOW() WHERE created_at IS NULL;
UPDATE public.servers SET name = 'Unnamed Server' WHERE name IS NULL OR char_length(name) < 3;
-- PATCH: Assign orphaned servers to a fallback profile before deleting any as orphans
DO $$
DECLARE
    fallback_profile UUID;
BEGIN
    SELECT id INTO fallback_profile FROM public.profiles LIMIT 1;
    IF fallback_profile IS NOT NULL THEN
        UPDATE public.servers SET owner_id = fallback_profile WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM public.profiles);
    END IF;
END $$;
DELETE FROM public.servers WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM public.profiles);
ALTER TABLE public.servers ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.servers ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.servers ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.servers ALTER COLUMN name SET NOT NULL;

-- === SERVER MEMBERS TABLE ===
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'server_members' AND table_type = 'BASE TABLE'
  ) THEN
    -- All ALTER TABLE and cleanup must happen before renaming to _base
    ALTER TABLE public.server_members
        ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY,
        ADD COLUMN IF NOT EXISTS server_id UUID,
        ADD COLUMN IF NOT EXISTS user_id UUID,
        ADD COLUMN IF NOT EXISTS role server_role DEFAULT 'member',
        ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    DELETE FROM public.server_members WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM public.profiles) OR server_id IS NULL OR server_id NOT IN (SELECT id FROM public.servers);
    UPDATE public.server_members SET joined_at = NOW() WHERE joined_at IS NULL;
    UPDATE public.server_members SET role = 'member' WHERE role IS NULL OR role NOT IN ('owner','admin','moderator','member');
    ALTER TABLE public.server_members ALTER COLUMN server_id SET NOT NULL;
    ALTER TABLE public.server_members ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE public.server_members ALTER COLUMN role SET NOT NULL;
    ALTER TABLE public.server_members ALTER COLUMN joined_at SET NOT NULL;
    -- PATCH: Rename server_members table and create a read-only view
    ALTER TABLE public.server_members RENAME TO server_members_base;
    CREATE VIEW public.server_members AS
    SELECT
      id,
      server_id,
      user_id,
      role,
      joined_at
    FROM public.server_members_base;
  END IF;
END $$;

-- === SERVER MESSAGES TABLE ===
ALTER TABLE public.server_messages
    ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS server_id UUID,
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS media_type media_type DEFAULT 'image',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS parent_message_id UUID;
DELETE FROM public.server_messages WHERE server_id IS NULL OR server_id NOT IN (SELECT id FROM public.servers) OR user_id IS NULL OR user_id NOT IN (SELECT id FROM public.profiles);
UPDATE public.server_messages SET created_at = NOW() WHERE created_at IS NULL;
UPDATE public.server_messages SET updated_at = NOW() WHERE updated_at IS NULL;
-- Patch: Only use valid enum values for media_type
UPDATE public.server_messages SET media_type = 'image' WHERE media_type IS NULL OR media_type NOT IN ('image','video');
ALTER TABLE public.server_messages ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.server_messages ALTER COLUMN server_id SET NOT NULL;
ALTER TABLE public.server_messages ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.server_messages ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.server_messages ALTER COLUMN updated_at SET NOT NULL;

-- === TRADE IDEAS TABLE ===
ALTER TABLE public.trade_ideas
    ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY,
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS profile_id UUID,
    ADD COLUMN IF NOT EXISTS show_support BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS tags TEXT[],
    ADD COLUMN IF NOT EXISTS crypto_link TEXT,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS instrument TEXT,
    ADD COLUMN IF NOT EXISTS breakdown TEXT;
DELETE FROM public.trade_ideas WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM public.profiles);
UPDATE public.trade_ideas SET created_at = NOW() WHERE created_at IS NULL;
UPDATE public.trade_ideas SET title = 'Untitled' WHERE title IS NULL OR char_length(title) < 3;
ALTER TABLE public.trade_ideas ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.trade_ideas ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.trade_ideas ALTER COLUMN title SET NOT NULL;

-- === FOREIGN KEY CONSTRAINTS ===
-- Update foreign key constraints to reference the base table where needed.
ALTER TABLE public.servers DROP CONSTRAINT IF EXISTS servers_owner_id_fkey;
ALTER TABLE public.servers ADD CONSTRAINT servers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.server_members_base DROP CONSTRAINT IF EXISTS server_members_user_id_fkey; -- Update constraint on base table
ALTER TABLE public.server_members_base ADD CONSTRAINT server_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.server_members_base DROP CONSTRAINT IF EXISTS server_members_server_id_fkey; -- Update constraint on base table
ALTER TABLE public.server_members_base ADD CONSTRAINT server_members_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;
ALTER TABLE public.server_messages DROP CONSTRAINT IF EXISTS server_messages_server_id_fkey;
ALTER TABLE public.server_messages ADD CONSTRAINT server_messages_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;
ALTER TABLE public.server_messages DROP CONSTRAINT IF EXISTS server_messages_user_id_fkey;
ALTER TABLE public.server_messages ADD CONSTRAINT server_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.trade_ideas DROP CONSTRAINT IF EXISTS trade_ideas_user_id_fkey;
ALTER TABLE public.trade_ideas ADD CONSTRAINT trade_ideas_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- === TRIGGERS FOR updated_at ===
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_profiles') THEN
        CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_server_messages') THEN
        CREATE TRIGGER set_updated_at_server_messages BEFORE UPDATE ON public.server_messages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

-- === END MASTER MIGRATION ===

-- === RLS POLICIES FOR CRITICAL TABLES ===
-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enable_read_access_all_profiles ON public.profiles;
CREATE POLICY enable_read_access_all_profiles ON public.profiles
    FOR SELECT USING (true);
DROP POLICY IF EXISTS users_update_own_profile ON public.profiles;
CREATE POLICY users_update_own_profile ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Admin bypass for troubleshooting: allow admins to update any profile
DROP POLICY IF EXISTS admin_update_any_profile ON public.profiles;
CREATE POLICY admin_update_any_profile ON public.profiles
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
      )
    );
DROP POLICY IF EXISTS users_insert_own_profile ON public.profiles;
CREATE POLICY users_insert_own_profile ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- SERVER_MEMBERS (RLS and policies only on base table, not view)

-- SERVERS
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enable_read_access_all_servers ON public.servers;
CREATE POLICY enable_read_access_all_servers ON public.servers
    FOR SELECT USING (true);
DROP POLICY IF EXISTS users_create_servers ON public.servers;
CREATE POLICY users_create_servers ON public.servers
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS owners_update_own_servers ON public.servers;
CREATE POLICY owners_update_own_servers ON public.servers
    FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS owners_delete_own_servers ON public.servers;
CREATE POLICY owners_delete_own_servers ON public.servers
    FOR DELETE USING (auth.uid() = owner_id);

-- === PATCH: FORCE profiles.id TO MATCH auth.users.id ===
UPDATE public.profiles p
SET id = u.id
FROM auth.users u
WHERE p.email = u.email AND p.id <> u.id;
-- Remove any duplicate profiles for the same id (keep the most recent)
DELETE FROM public.profiles a USING public.profiles b
WHERE a.email = b.email AND a.id <> b.id AND a.created_at < b.created_at;

-- === PATCH: REMOVE ORPHANED DATA IN ALL CRITICAL TABLES ===
-- Remove servers with invalid owner_id
DELETE FROM public.servers WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM public.profiles);
-- Remove server_members with invalid user_id or server_id
DELETE FROM public.server_members_base WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM public.profiles) OR server_id IS NULL OR server_id NOT IN (SELECT id FROM public.servers);
-- Remove server_messages with invalid user_id or server_id
DELETE FROM public.server_messages WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM public.profiles) OR server_id IS NULL OR server_id NOT IN (SELECT id FROM public.servers);
-- Remove trade_ideas with invalid user_id
DELETE FROM public.trade_ideas WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM public.profiles);

-- === FINAL CLEANUP: ORPHANED DATA, CONSTRAINTS, AND RLS PATCH ===
-- Keep the cleanup section, but ensure it references the base table where necessary
-- Remove any remaining orphaned server_members (reference base table)
DELETE FROM public.server_members_base WHERE server_id NOT IN (SELECT id FROM public.servers) OR user_id NOT IN (SELECT id FROM public.profiles);

-- Remove any remaining orphaned servers
DELETE FROM public.servers WHERE owner_id NOT IN (SELECT id FROM public.profiles);

-- Remove any remaining orphaned server_messages
DELETE FROM public.server_messages WHERE server_id NOT IN (SELECT id FROM public.servers) OR user_id NOT IN (SELECT id FROM public.profiles);

-- Remove any remaining orphaned trade_ideas
DELETE FROM public.trade_ideas WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Remove any profiles with NULL or invalid UUID id
DELETE FROM public.profiles WHERE id IS NULL OR id::text !~* '^[0-9a-fA-F-]{36}$';

-- Remove duplicate emails in profiles (keep the first by created_at)
DELETE FROM public.profiles a USING public.profiles b
WHERE a.email = b.email AND a.created_at > b.created_at;

-- Ensure all foreign key constraints are present and valid
ALTER TABLE public.servers DROP CONSTRAINT IF EXISTS servers_owner_id_fkey;
ALTER TABLE public.servers ADD CONSTRAINT servers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.server_members_base DROP CONSTRAINT IF EXISTS server_members_user_id_fkey;
ALTER TABLE public.server_members_base ADD CONSTRAINT server_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.server_members_base DROP CONSTRAINT IF EXISTS server_members_server_id_fkey;
ALTER TABLE public.server_members_base ADD CONSTRAINT server_members_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;
ALTER TABLE public.server_messages DROP CONSTRAINT IF EXISTS server_messages_server_id_fkey;
ALTER TABLE public.server_messages ADD CONSTRAINT server_messages_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;
ALTER TABLE public.server_messages DROP CONSTRAINT IF EXISTS server_messages_user_id_fkey;
ALTER TABLE public.server_messages ADD CONSTRAINT server_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.trade_ideas DROP CONSTRAINT IF EXISTS trade_ideas_user_id_fkey;
ALTER TABLE public.trade_ideas ADD CONSTRAINT trade_ideas_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Ensure all RLS policies are present and correct
-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enable_read_access_all_profiles ON public.profiles;
CREATE POLICY enable_read_access_all_profiles ON public.profiles
    FOR SELECT USING (true);
DROP POLICY IF EXISTS users_update_own_profile ON public.profiles;
CREATE POLICY users_update_own_profile ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Admin bypass for troubleshooting: allow admins to update any profile
DROP POLICY IF EXISTS admin_update_any_profile ON public.profiles;
CREATE POLICY admin_update_any_profile ON public.profiles
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
      )
    );
DROP POLICY IF EXISTS users_insert_own_profile ON public.profiles;
CREATE POLICY users_insert_own_profile ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
-- SERVER_MEMBERS (RLS and policies only on base table, not view)
-- SERVERS
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enable_read_access_all_servers ON public.servers;
CREATE POLICY enable_read_access_all_servers ON public.servers
    FOR SELECT USING (true);
DROP POLICY IF EXISTS users_create_servers ON public.servers;
CREATE POLICY users_create_servers ON public.servers
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS owners_update_own_servers ON public.servers;
CREATE POLICY owners_update_own_servers ON public.servers
    FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS owners_delete_own_servers ON public.servers;
CREATE POLICY owners_delete_own_servers ON public.servers
    FOR DELETE USING (auth.uid() = owner_id);

-- === PATCH: ENSURE EVERY AUTH USER HAS A PROFILE ===
INSERT INTO public.profiles (id, email, username, avatar_url, created_at, updated_at)
SELECT u.id, u.email, 'user_' || u.id, COALESCE(u.raw_user_meta_data->>'avatar_url', 'https://ui-avatars.com/api/?name=user'), NOW(), NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- === AUTO-CREATE PROFILE ON USER SIGNUP ===
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'user_' || NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://ui-avatars.com/api/?name=user'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
