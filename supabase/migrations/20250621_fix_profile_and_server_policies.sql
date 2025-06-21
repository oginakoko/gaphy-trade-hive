-- Enable RLS on profiles and servers tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Public servers are viewable by everyone." ON public.servers;
DROP POLICY IF EXISTS "Server owners can update their servers." ON public.servers;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone."
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile."
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for servers
CREATE POLICY "Public servers are viewable by everyone."
  ON public.servers
  FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Server owners can update their servers."
  ON public.servers
  FOR UPDATE
  USING (auth.uid() = owner_id);