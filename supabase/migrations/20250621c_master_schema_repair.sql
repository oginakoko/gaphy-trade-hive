-- MASTER PATCH: Fix all user/profile/server/trade_idea data, RLS, and relationships

-- 1. Ensure every user in auth.users has a matching profile
INSERT INTO public.profiles (id, username, email, avatar_url, created_at, updated_at)
SELECT u.id, 'user_' || LEFT(u.id::text, 8), u.email, COALESCE(u.raw_user_meta_data->>'avatar_url', 'https://ui-avatars.com/api/?name=' || LEFT(u.id::text, 8)), NOW(), NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 2. Remove orphaned servers, server_members, server_messages, trade_ideas
DELETE FROM public.server_members WHERE user_id NOT IN (SELECT id FROM public.profiles);
DELETE FROM public.server_messages WHERE user_id NOT IN (SELECT id FROM public.profiles);
DELETE FROM public.server_messages WHERE server_id NOT IN (SELECT id FROM public.servers);
DELETE FROM public.trade_ideas WHERE user_id NOT IN (SELECT id FROM public.profiles);
DELETE FROM public.servers WHERE owner_id NOT IN (SELECT id FROM public.profiles);

-- 3. Add missing columns if not present (idempotent)
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='servers' AND column_name='owner_id') THEN ALTER TABLE public.servers ADD COLUMN owner_id uuid; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='server_members' AND column_name='user_id') THEN ALTER TABLE public.server_members ADD COLUMN user_id uuid; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='server_messages' AND column_name='user_id') THEN ALTER TABLE public.server_messages ADD COLUMN user_id uuid; END IF; END $$;

-- 4. Fix RLS for profiles, servers, server_members, server_messages
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY; -- server_members is a view, skip RLS
ALTER TABLE public.server_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own profile
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='select_own_profile') THEN
  CREATE POLICY select_own_profile ON public.profiles FOR SELECT USING (auth.uid() = id);
END IF; END $$;

-- Allow users to select servers they are a member of or public
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='servers' AND policyname='select_public_or_member') THEN
  CREATE POLICY select_public_or_member ON public.servers FOR SELECT USING (
    is_public OR id IN (SELECT server_id FROM public.server_members WHERE user_id = auth.uid())
  );
END IF; END $$;

-- 5. Clean up duplicate or invalid profiles
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- 6. Ensure all foreign keys are valid
-- ALTER TABLE public.server_members DROP CONSTRAINT IF EXISTS server_members_user_id_fkey;
-- ALTER TABLE public.server_members ADD CONSTRAINT server_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.server_messages DROP CONSTRAINT IF EXISTS server_messages_user_id_fkey;
ALTER TABLE public.server_messages ADD CONSTRAINT server_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.servers DROP CONSTRAINT IF EXISTS servers_owner_id_fkey;
ALTER TABLE public.servers ADD CONSTRAINT servers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 7. Ensure all referenced columns are uuid
-- DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='server_members' AND column_name='user_id' AND data_type <> 'uuid') THEN ALTER TABLE public.server_members ALTER COLUMN user_id TYPE uuid USING user_id::uuid; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='server_messages' AND column_name='user_id' AND data_type <> 'uuid') THEN ALTER TABLE public.server_messages ALTER COLUMN user_id TYPE uuid USING user_id::uuid; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='servers' AND column_name='owner_id' AND data_type <> 'uuid') THEN ALTER TABLE public.servers ALTER COLUMN owner_id TYPE uuid USING owner_id::uuid; END IF; END $$;

-- 8. Ensure all trade_ideas.user_id are valid uuids
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trade_ideas' AND column_name='user_id' AND data_type <> 'uuid') THEN ALTER TABLE public.trade_ideas ALTER COLUMN user_id TYPE uuid USING user_id::uuid; END IF; END $$;

-- 9. Add triggers to auto-create profile on new user
CREATE OR REPLACE FUNCTION public.create_profile_on_user_signup() RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, username, email, avatar_url, created_at, updated_at) VALUES (
      NEW.id, 'user_' || LEFT(NEW.id::text, 8), NEW.email, COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://ui-avatars.com/api/?name=' || LEFT(NEW.id::text, 8)), NOW(), NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_signup ON auth.users;
CREATE TRIGGER on_user_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_user_signup();

-- 10. Done!
