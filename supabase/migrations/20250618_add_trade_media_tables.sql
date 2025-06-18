-- Add table for trade media
CREATE TABLE IF NOT EXISTS public.trade_idea_media (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  trade_idea_id uuid REFERENCES public.trade_ideas(id) ON DELETE CASCADE,
  media_type text CHECK (media_type IN ('image', 'video', 'link')),
  url text NOT NULL,
  title text,
  description text,
  thumbnail_url text,
  position integer DEFAULT 0,
  user_id uuid REFERENCES auth.users(id)
);

-- Add indexes
CREATE INDEX trade_idea_media_trade_idea_id_idx ON public.trade_idea_media(trade_idea_id);

-- Add RLS policies
ALTER TABLE public.trade_idea_media ENABLE ROW LEVEL SECURITY;

-- Everyone can view media
CREATE POLICY "Everyone can view media"
  ON public.trade_idea_media
  FOR SELECT
  USING (true);

-- Only post creator can insert media
CREATE POLICY "Post creator can insert media"
  ON public.trade_idea_media
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM public.trade_ideas 
      WHERE id = trade_idea_id
    )
  );

-- Only post creator can update media
CREATE POLICY "Post creator can update media"
  ON public.trade_idea_media
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM public.trade_ideas 
      WHERE id = trade_idea_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM public.trade_ideas 
      WHERE id = trade_idea_id
    )
  );

-- Only post creator can delete media
CREATE POLICY "Post creator can delete media"
  ON public.trade_idea_media
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM public.trade_ideas 
      WHERE id = trade_idea_id
    )
  );
