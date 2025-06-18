
-- Create table for trade idea media items
CREATE TABLE public.trade_idea_media (
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
ALTER TABLE public.trade_idea_media 
ADD CONSTRAINT fk_trade_idea_media_trade_idea 
FOREIGN KEY (trade_idea_id) REFERENCES public.trade_ideas(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.trade_idea_media ENABLE ROW LEVEL SECURITY;

-- Create policies for trade_idea_media
CREATE POLICY "Anyone can view trade idea media" 
  ON public.trade_idea_media 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage trade idea media" 
  ON public.trade_idea_media 
  FOR ALL 
  USING (auth.uid() = '73938002-b3f8-4444-ad32-6a46cbf8e075');

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trade-videos', 'trade-videos', true);

-- Create storage policies for trade-videos bucket
CREATE POLICY "Anyone can view trade videos" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'trade-videos');

CREATE POLICY "Admins can upload trade videos" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'trade-videos' AND auth.uid() = '73938002-b3f8-4444-ad32-6a46cbf8e075');

CREATE POLICY "Admins can update trade videos" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'trade-videos' AND auth.uid() = '73938002-b3f8-4444-ad32-6a46cbf8e075');

CREATE POLICY "Admins can delete trade videos" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'trade-videos' AND auth.uid() = '73938002-b3f8-4444-ad32-6a46cbf8e075');
