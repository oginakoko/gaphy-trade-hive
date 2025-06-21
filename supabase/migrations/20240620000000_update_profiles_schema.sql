-- Update profiles table with new schema
-- Fix: Set placeholder for NULL usernames before enforcing NOT NULL
UPDATE public.profiles SET username = 'user_' || id WHERE username IS NULL;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ALTER COLUMN username SET NOT NULL,
ADD CONSTRAINT username_length_check CHECK (char_length(username) >= 3);

-- Create the moddatetime function if it doesn't exist
CREATE OR REPLACE FUNCTION moddatetime()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for automatic updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW 
    EXECUTE FUNCTION moddatetime();

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
    ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
    ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles
    FOR SELECT 
    USING (is_admin = true);

-- === ENUM TYPES ===
-- ad_status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_status') THEN CREATE TYPE public.ad_status AS ENUM ('pending_payment','active','paused','rejected','completed'); END IF; END $$;
-- mpesa_transaction_status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mpesa_transaction_status') THEN CREATE TYPE public.mpesa_transaction_status AS ENUM ('pending','completed','failed','cancelled'); END IF; END $$;
-- notification_type
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN CREATE TYPE public.notification_type AS ENUM ('new_comment','new_like','server_message','private_message','ad_status_update','new_follower','trade_analysis_update'); END IF; END $$;
-- server_role
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'server_role') THEN CREATE TYPE public.server_role AS ENUM ('member','moderator','admin'); END IF; END $$;
-- media_type
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN CREATE TYPE public.media_type AS ENUM ('image','video','audio','document'); END IF; END $$;
-- trade_direction
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_direction') THEN CREATE TYPE public.trade_direction AS ENUM ('Long','Short'); END IF; END $$;
-- trade_sentiment
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_sentiment') THEN CREATE TYPE public.trade_sentiment AS ENUM ('Bullish','Bearish','Neutral'); END IF; END $$;
-- trade_media_type
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_media_type') THEN CREATE TYPE public.trade_media_type AS ENUM ('video','image','link'); END IF; END $$;
-- trade_status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_status') THEN CREATE TYPE public.trade_status AS ENUM ('open','closed','cancelled'); END IF; END $$;

-- === TABLES & COLUMNS ===
-- Add missing columns to existing tables (safe, non-destructive)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.trade_ideas 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS show_support BOOLEAN DEFAULT false;

ALTER TABLE public.servers 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.server_members 
ADD COLUMN IF NOT EXISTS role public.server_role NOT NULL DEFAULT 'member',
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

ALTER TABLE public.server_messages 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS parent_message_id UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS status public.ad_status NOT NULL DEFAULT 'pending_payment',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS cost NUMERIC,
ADD COLUMN IF NOT EXISTS media_type TEXT,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE public.affiliate_links 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION moddatetime() RETURNS trigger AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now()); RETURN NEW; END; $$ LANGUAGE plpgsql;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at') THEN CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION moddatetime(); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_updated_at_server_messages') THEN CREATE TRIGGER handle_updated_at_server_messages BEFORE UPDATE ON public.server_messages FOR EACH ROW EXECUTE FUNCTION moddatetime(); END IF; END $$;

-- === CREATE TABLES IF NOT EXISTS ===
CREATE TABLE IF NOT EXISTS public.app_config (
  key text NOT NULL PRIMARY KEY,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.comments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  trade_idea_id bigint NOT NULL REFERENCES public.trade_ideas(id),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE TABLE IF NOT EXISTS public.likes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  trade_idea_id bigint NOT NULL REFERENCES public.trade_ideas(id),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_like_per_user_trade_idea UNIQUE (user_id, trade_idea_id)
);
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id),
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  type public.notification_type NOT NULL,
  reference_id uuid,
  server_id uuid REFERENCES public.servers(id),
  is_read boolean NOT NULL DEFAULT false,
  CONSTRAINT unique_notification UNIQUE (recipient_id, sender_id, type, reference_id, server_id)
);
CREATE TABLE IF NOT EXISTS public.unread_message_counts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id),
  unread_count integer DEFAULT 0,
  last_checked_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_follows (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES public.profiles(id),
  following_id uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);
-- (Add more CREATE TABLE IF NOT EXISTS statements for any other missing tables as needed)

-- === RLS POLICIES (SAFE) ===
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- (Add more RLS policies for other tables as needed)

-- === END OF MIGRATION ===
