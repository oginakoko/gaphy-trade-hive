-- Complete database setup for Trade Hive

-- Create necessary tables if they don't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  username text NOT NULL UNIQUE CHECK (char_length(username) >= 3),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.servers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL CHECK (char_length(name) >= 3),
  description text,
  image_url text,
  invite_code text UNIQUE,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.server_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_id uuid REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.server_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content text NOT NULL,
  server_id uuid REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.private_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content text NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  content text NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Public servers are viewable by everyone." ON public.servers;
DROP POLICY IF EXISTS "Server owners can update their servers." ON public.servers;
DROP POLICY IF EXISTS "Server messages are viewable by server members." ON public.server_messages;
DROP POLICY IF EXISTS "Users can create messages in servers they are members of." ON public.server_messages;
DROP POLICY IF EXISTS "Users can delete their own messages." ON public.server_messages;
DROP POLICY IF EXISTS "Server members are viewable by other members." ON public.server_members;
DROP POLICY IF EXISTS "Server owners can manage members." ON public.server_members;
DROP POLICY IF EXISTS "Users can view their own private messages." ON public.private_messages;
DROP POLICY IF EXISTS "Users can send private messages." ON public.private_messages;
DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
DROP POLICY IF EXISTS "Users can mark their notifications as read." ON public.notifications;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone."
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile."
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for server members
CREATE POLICY "Server members are viewable by everyone."
  ON public.server_members
  FOR SELECT
  USING (true);

CREATE POLICY "Users can join public servers."
  ON public.server_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.servers s
      WHERE s.id = server_members.server_id
      AND (s.is_public = true OR s.owner_id = auth.uid())
    )
    AND auth.uid() = user_id
    AND role = 'member'
  );

CREATE POLICY "Server owners and admins can manage members."
  ON public.server_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- Create policies for servers
CREATE POLICY "Public servers are viewable by everyone."
  ON public.servers
  FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Server owners can update their servers."
  ON public.servers
  FOR ALL
  USING (auth.uid() = owner_id);

-- Create policies for server messages
CREATE POLICY "Server messages are viewable by server members."
  ON public.server_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.server_members
      WHERE server_members.server_id = server_messages.server_id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in servers they are members of."
  ON public.server_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.server_members
      WHERE server_members.server_id = server_messages.server_id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own messages."
  ON public.server_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for server members
CREATE POLICY "Server members are viewable by other members."
  ON public.server_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Server owners can manage members."
  ON public.server_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role = 'owner'
    )
  );

-- Create policies for private messages
CREATE POLICY "Users can view their own private messages."
  ON public.private_messages
  FOR SELECT
  USING (auth.uid() IN (sender_id, recipient_id));

CREATE POLICY "Users can send private messages."
  ON public.private_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications."
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can mark their notifications as read."
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username text;
  unique_username text;
  random_suffix text;
BEGIN
  -- 1. Determine initial username
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- 2. If username is too short, append random string
  IF char_length(new_username) < 3 THEN
    new_username := 'user_' || substr(md5(random()::text), 1, 8);
  END IF;

  -- 3. Ensure username is unique
  unique_username := new_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = unique_username) LOOP
    random_suffix := substr(md5(random()::text), 1, 4);
    unique_username := new_username || '_' || random_suffix;
  END LOOP;

  -- 4. Create profile
  INSERT INTO public.profiles (id, email, username, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    unique_username,
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_server_members_server_user ON public.server_members(server_id, user_id);
CREATE INDEX IF NOT EXISTS idx_server_messages_server_id ON public.server_messages(server_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);

-- Backfill missing profiles
DO $$
DECLARE
  r RECORD;
  new_username text;
  unique_username text;
  random_suffix text;
BEGIN
  FOR r IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    new_username := COALESCE(
      r.raw_user_meta_data->>'username',
      split_part(r.email, '@', 1)
    );

    IF char_length(new_username) < 3 THEN
      new_username := 'user_' || substr(md5(random()::text), 1, 8);
    END IF;

    unique_username := new_username;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = unique_username) LOOP
      random_suffix := substr(md5(random()::text), 1, 4);
      unique_username := new_username || '_' || random_suffix;
    END LOOP;

    INSERT INTO public.profiles (id, email, username, avatar_url, created_at, updated_at)
    VALUES (
      r.id,
      r.email,
      unique_username,
      r.raw_user_meta_data->>'avatar_url',
      NOW(),
      NOW()
    );
  END LOOP;
END;
$$;