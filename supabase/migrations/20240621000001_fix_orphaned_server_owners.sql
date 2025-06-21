-- Find orphaned servers (servers with owner_id not in profiles)
SELECT id, owner_id FROM public.servers WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM public.profiles);

-- Optionally, set orphaned owner_id to a valid admin or system user (replace 'YOUR_ADMIN_ID' with a real id)
-- UPDATE public.servers SET owner_id = 'YOUR_ADMIN_ID' WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM public.profiles);

-- (Recommended) Add a foreign key constraint if not present
ALTER TABLE public.servers DROP CONSTRAINT IF EXISTS servers_owner_id_fkey;
ALTER TABLE public.servers ADD CONSTRAINT servers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- === AUTO-FIX ORPHANED FOREIGN KEYS FOR SERVERS AND SERVER MEMBERS ===
-- 1. Set all orphaned servers.owner_id to a valid admin (replace 'YOUR_ADMIN_ID' with a real id)
DO $$
DECLARE
  admin_id uuid := (SELECT id FROM public.profiles WHERE is_admin IS TRUE LIMIT 1);
BEGIN
  IF admin_id IS NOT NULL THEN
    UPDATE public.servers SET owner_id = admin_id WHERE owner_id IS NULL OR owner_id NOT IN (SELECT id FROM public.profiles);
  END IF;
END $$;

-- 2. Remove orphaned server_members.user_id
DELETE FROM public.server_members WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM public.profiles);
-- 3. Remove orphaned server_members.server_id
DELETE FROM public.server_members WHERE server_id IS NULL OR server_id NOT IN (SELECT id FROM public.servers);

-- 4. Add/repair foreign key constraints
ALTER TABLE public.servers DROP CONSTRAINT IF EXISTS servers_owner_id_fkey;
ALTER TABLE public.servers ADD CONSTRAINT servers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.server_members DROP CONSTRAINT IF EXISTS server_members_user_id_fkey;
ALTER TABLE public.server_members ADD CONSTRAINT server_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.server_members DROP CONSTRAINT IF EXISTS server_members_server_id_fkey;
ALTER TABLE public.server_members ADD CONSTRAINT server_members_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;

-- === END AUTO-FIX ===

-- === AUTO-FIX PROFILES TABLE FOR API COMPATIBILITY ===
-- 1. Fill missing usernames with placeholder
UPDATE public.profiles SET username = 'user_' || id WHERE username IS NULL OR char_length(username) < 3;
-- 2. Fill missing emails with placeholder
UPDATE public.profiles SET email = 'user_' || id || '@example.com' WHERE email IS NULL OR char_length(email) < 3;
-- 3. Remove rows with NULL id (should not exist, but just in case)
DELETE FROM public.profiles WHERE id IS NULL;
-- 4. Remove any non-UUID id (should not exist, but just in case)
DELETE FROM public.profiles WHERE id::text !~* '^[0-9a-fA-F-]{36}$';
-- 5. Remove any row with unsupported data types (should not exist, but just in case)
-- (No action needed unless you have custom columns)
-- 6. Ensure all columns are standard types (text, uuid, boolean, timestamp, etc.)
-- (No action needed unless you have custom columns)
-- 7. Enforce NOT NULL and UNIQUE constraints
ALTER TABLE public.profiles ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS username_length_check;
ALTER TABLE public.profiles ADD CONSTRAINT username_length_check CHECK (char_length(username) >= 3);
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS email_unique;
ALTER TABLE public.profiles ADD CONSTRAINT email_unique UNIQUE (email);
-- === END AUTO-FIX ===
