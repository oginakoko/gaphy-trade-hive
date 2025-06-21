-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username text;
  unique_username text;
  random_suffix text;
BEGIN
  -- 1. Determine initial username
  new_username := NEW.raw_user_meta_data->>'username';

  -- 2. Fallback to email if username is not present
  IF new_username IS NULL OR char_length(new_username) = 0 THEN
    new_username := split_part(NEW.email, '@', 1);
  END IF;

  -- 3. Fallback to random string if still no username
  IF new_username IS NULL OR char_length(new_username) = 0 THEN
    new_username := 'user_' || substr(md5(random()::text), 1, 8);
  END IF;

  -- 4. Ensure username is at least 3 characters long
  IF char_length(new_username) < 3 THEN
    new_username := new_username || '_' || substr(md5(random()::text), 1, 4);
  END IF;

  -- 5. Ensure the username is unique
  unique_username := new_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = unique_username) LOOP
    random_suffix := substr(md5(random()::text), 1, 4);
    unique_username := new_username || '_' || random_suffix;
  END LOOP;

  -- 6. Insert the new profile
  INSERT INTO public.profiles (id, email, username, avatar_url)
  VALUES (NEW.id, NEW.email, unique_username, NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();