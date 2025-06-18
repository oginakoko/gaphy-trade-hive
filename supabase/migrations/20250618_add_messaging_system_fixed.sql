-- Ensure admin role exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Drop existing objects
DROP TRIGGER IF EXISTS update_messages_updated_at ON private_messages;
DROP TRIGGER IF EXISTS auto_follow_admin ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TABLE IF EXISTS public.user_follows CASCADE;
DROP TABLE IF EXISTS public.private_messages CASCADE;

-- Create follows table
CREATE TABLE public.user_follows (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create private messages table
CREATE TABLE public.private_messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_messages_sender ON private_messages(sender_id);
CREATE INDEX idx_messages_recipient ON private_messages(recipient_id);
CREATE INDEX idx_messages_created ON private_messages(created_at DESC);
CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create admin follow function
CREATE OR REPLACE FUNCTION auto_follow_admin()
RETURNS TRIGGER AS $$
DECLARE
    admin_ids UUID[];
BEGIN    SELECT ARRAY_AGG(auth.users.id)
    INTO admin_ids
    FROM auth.users
    JOIN public.profiles ON auth.users.id = profiles.id
    WHERE profiles.is_admin = true;
    
    IF admin_ids IS NOT NULL THEN
        -- New user follows admins
        INSERT INTO public.user_follows (follower_id, following_id)
        SELECT NEW.id, admin_id
        FROM UNNEST(admin_ids) AS admin_id
        ON CONFLICT DO NOTHING;
        
        -- Admins follow new user
        INSERT INTO public.user_follows (follower_id, following_id)
        SELECT admin_id, NEW.id
        FROM UNNEST(admin_ids) AS admin_id
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON private_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER auto_follow_admin
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_follow_admin();

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "allow_select_follows" ON public.user_follows 
    AS PERMISSIVE FOR SELECT TO public 
    USING (true);

CREATE POLICY "allow_insert_follows" ON public.user_follows 
    AS PERMISSIVE FOR INSERT TO public 
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "allow_delete_follows" ON public.user_follows 
    AS PERMISSIVE FOR DELETE TO public 
    USING (auth.uid() = follower_id);

CREATE POLICY "allow_select_messages" ON public.private_messages 
    AS PERMISSIVE FOR SELECT TO public 
    USING (
        auth.uid() IN (sender_id, recipient_id) 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "allow_insert_messages" ON public.private_messages 
    AS PERMISSIVE FOR INSERT TO public 
    WITH CHECK (
        auth.uid() = sender_id 
        AND (
            EXISTS (
                SELECT 1 FROM user_follows f1
                JOIN user_follows f2 
                    ON f1.follower_id = f2.following_id 
                    AND f1.following_id = f2.follower_id
                WHERE f1.follower_id = auth.uid() 
                    AND f1.following_id = recipient_id
            )            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND is_admin = true
            )            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = recipient_id 
                AND is_admin = true
            )
        )
    );

CREATE POLICY "allow_update_messages" ON public.private_messages 
    AS PERMISSIVE FOR UPDATE TO public 
    USING (
        auth.uid() = recipient_id 
        AND NOT is_read
    )
    WITH CHECK (
        auth.uid() = recipient_id 
        AND is_read = true
    );
