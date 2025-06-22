-- Drop existing problematic objects and recreate them properly
DROP TRIGGER IF EXISTS update_messages_updated_at ON private_messages;
DROP TRIGGER IF EXISTS auto_follow_admin ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_new_message ON private_messages;
DROP TABLE IF EXISTS public.message_attachments CASCADE;
DROP TABLE IF EXISTS public.unread_message_counts CASCADE;
DROP TABLE IF EXISTS public.private_messages CASCADE;
DROP TABLE IF EXISTS public.user_follows CASCADE;

-- Create user_follows table for following system
CREATE TABLE public.user_follows (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create private_messages table
CREATE TABLE public.private_messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_broadcast BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create message_attachments table
CREATE TABLE public.message_attachments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id BIGINT REFERENCES public.private_messages(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT CHECK (type IN ('image', 'video', 'audio', 'document')) NOT NULL,
    filename TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unread_message_counts table
CREATE TABLE public.unread_message_counts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    unread_count INT DEFAULT 0,
    last_checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);
CREATE INDEX idx_messages_sender ON private_messages(sender_id);
CREATE INDEX idx_messages_recipient ON private_messages(recipient_id);
CREATE INDEX idx_messages_created ON private_messages(created_at DESC);
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-follow admin for new users
CREATE OR REPLACE FUNCTION auto_follow_admin_for_new_users()
RETURNS TRIGGER AS $$
DECLARE
    admin_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(id)
    INTO admin_ids
    FROM public.profiles
    WHERE is_admin = true;
    
    IF admin_ids IS NOT NULL THEN
        -- New user follows admins (for support chat)
        INSERT INTO public.user_follows (follower_id, following_id)
        SELECT NEW.id, admin_id
        FROM UNNEST(admin_ids) AS admin_id
        ON CONFLICT DO NOTHING;
        
        -- Admins follow new user (so they can message back)
        INSERT INTO public.user_follows (follower_id, following_id)
        SELECT admin_id, NEW.id
        FROM UNNEST(admin_ids) AS admin_id
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update unread counts
CREATE OR REPLACE FUNCTION update_unread_message_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Don't count broadcast messages in unread count for now
    IF NEW.is_broadcast = FALSE THEN
        INSERT INTO public.unread_message_counts (user_id, unread_count)
        VALUES (NEW.recipient_id, 1)
        ON CONFLICT (user_id) DO UPDATE SET 
            unread_count = unread_message_counts.unread_count + 1,
            last_checked_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON private_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER auto_follow_admin
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_follow_admin_for_new_users();

CREATE TRIGGER on_new_message
    AFTER INSERT ON private_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_unread_message_count();

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unread_message_counts ENABLE ROW LEVEL SECURITY;

-- Policies for user_follows
CREATE POLICY "Allow authenticated users to view follows" ON public.user_follows
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow users to insert their own follows" ON public.user_follows
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Allow users to delete their own follows" ON public.user_follows
    FOR DELETE TO authenticated
    USING (auth.uid() = follower_id);

-- Policies for private_messages
CREATE POLICY "Allow users to view messages they are part of or if they are admin" ON public.private_messages
    FOR SELECT TO authenticated
    USING (
        auth.uid() IN (sender_id, recipient_id)
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
        OR is_broadcast = true
    );

CREATE POLICY "Allow users to send messages" ON public.private_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND (
            -- Admin can message anyone
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND is_admin = true
            )
            -- Users can message admins (support)
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = recipient_id
                AND is_admin = true
            )
            -- Users can message if mutual follow exists
            OR (
                EXISTS (
                    SELECT 1 FROM public.user_follows
                    WHERE follower_id = auth.uid() AND following_id = recipient_id
                )
                AND EXISTS (
                    SELECT 1 FROM public.user_follows
                    WHERE follower_id = recipient_id AND following_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Allow recipients to mark messages as read" ON public.private_messages
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = recipient_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    )
    WITH CHECK (
        (auth.uid() = recipient_id AND is_read = TRUE)
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Policies for message_attachments
CREATE POLICY "Allow users to view attachments for their messages" ON public.message_attachments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.private_messages
            WHERE id = message_attachments.message_id
            AND (
                sender_id = auth.uid() 
                OR recipient_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid()
                    AND is_admin = true
                )
            )
        )
    );

CREATE POLICY "Allow users to add attachments to their own messages" ON public.message_attachments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.private_messages
            WHERE id = message_attachments.message_id
            AND sender_id = auth.uid()
        )
    );

-- Policies for unread_message_counts
CREATE POLICY "Allow users to view their own unread counts" ON public.unread_message_counts
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own unread counts" ON public.unread_message_counts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow system to insert unread counts" ON public.unread_message_counts
    FOR INSERT TO authenticated
    WITH CHECK (true);