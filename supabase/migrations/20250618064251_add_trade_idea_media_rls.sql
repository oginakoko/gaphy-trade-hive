
-- Create table for trade idea media items
CREATE TABLE IF NOT EXISTS public.trade_idea_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_idea_id BIGINT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'image', 'link')),
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_trade_idea_media_trade_idea'
  ) THEN
    ALTER TABLE public.trade_idea_media 
    ADD CONSTRAINT fk_trade_idea_media_trade_idea 
    FOREIGN KEY (trade_idea_id) REFERENCES public.trade_ideas(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE public.trade_idea_media ENABLE ROW LEVEL SECURITY;

-- Create policies for trade_idea_media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Anyone can view trade idea media'
  ) THEN
    CREATE POLICY "Anyone can view trade idea media" 
      ON public.trade_idea_media 
      FOR SELECT 
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Admins can manage trade idea media'
  ) THEN
    CREATE POLICY "Admins can manage trade idea media" 
      ON public.trade_idea_media 
      FOR ALL 
      USING (auth.uid() = '73938002-b3f8-4444-ad32-6a46cbf8e075');
  END IF;
END
$$;

-- Create storage bucket for videos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'trade-videos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('trade-videos', 'trade-videos', true);
  END IF;
END
$$;

-- Create storage policies for trade-videos bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Anyone can view trade videos'
  ) THEN
    CREATE POLICY "Anyone can view trade videos" 
      ON storage.objects 
      FOR SELECT 
      USING (bucket_id = 'trade-videos');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Admins can upload trade videos'
  ) THEN
    CREATE POLICY "Admins can upload trade videos" 
      ON storage.objects 
      FOR INSERT 
      WITH CHECK (bucket_id = 'trade-videos' AND auth.uid() = '73938002-b3f8-4444-ad32-6a46cbf8e075');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Admins can update trade videos'
  ) THEN
    CREATE POLICY "Admins can update trade videos" 
      ON storage.objects 
      FOR UPDATE 
      USING (bucket_id = 'trade-videos' AND auth.uid() = '73938002-b3f8-4444-ad32-6a46cbf8e075');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Admins can delete trade videos'
  ) THEN
    CREATE POLICY "Admins can delete trade videos" 
      ON storage.objects 
      FOR DELETE 
      USING (bucket_id = 'trade-videos' AND auth.uid() = '73938002-b3f8-4444-ad32-6a46cbf8e075');
  END IF;
END
$$;
