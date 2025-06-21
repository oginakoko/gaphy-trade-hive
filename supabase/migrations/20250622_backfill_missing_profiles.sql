-- Backfill missing profiles for users that exist in auth.users but not in public.profiles
DO $$
DECLARE
    r RECORD;
    new_username text;
    unique_username text;
    random_suffix text;
BEGIN
    FOR r IN
        SELECT id, email, raw_user_meta_data FROM auth.users
        WHERE id NOT IN (SELECT id FROM public.profiles)
    LOOP
        new_username := COALESCE(r.raw_user_meta_data->>'username', split_part(r.email, '@', 1));

        IF char_length(new_username) < 3 THEN
            new_username := new_username || '_' || substr(md5(random()::text), 1, 4);
        END IF;

        unique_username := new_username;
        WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = unique_username) LOOP
            random_suffix := substr(md5(random()::text), 1, 4);
            unique_username := new_username || '_' || random_suffix;
        END LOOP;

        INSERT INTO public.profiles (id, email, username, avatar_url)
        VALUES (r.id, r.email, unique_username, r.raw_user_meta_data->>'avatar_url');
    END LOOP;
END $$;