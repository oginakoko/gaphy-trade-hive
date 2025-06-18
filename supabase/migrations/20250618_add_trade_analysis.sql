-- Create trade analysis table
CREATE TABLE IF NOT EXISTS public.trade_analysis (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_idea_id bigint REFERENCES public.trade_ideas(id),
    analyzed_text TEXT NOT NULL,
    entry_price DECIMAL,
    exit_price DECIMAL,
    target_price DECIMAL,
    stop_loss DECIMAL,
    risk_reward DECIMAL,
    direction TEXT CHECK (direction IN ('Long', 'Short')),
    asset TEXT,
    sentiment TEXT CHECK (sentiment IN ('Bullish', 'Bearish', 'Neutral')),
    key_points TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.trade_analysis ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow read access to everyone" ON public.trade_analysis
    FOR SELECT USING (true);

-- Allow insert/update only via service role (for AI updates)
CREATE POLICY "Allow insert via service role only" ON public.trade_analysis
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow update via service role only" ON public.trade_analysis
    FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Create function to update updated_at on changes
CREATE OR REPLACE FUNCTION update_trade_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_trade_analysis_updated_at
    BEFORE UPDATE ON public.trade_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_trade_analysis_updated_at();

-- Add indexes for performance
CREATE INDEX idx_trade_analysis_trade_idea_id ON public.trade_analysis(trade_idea_id);
CREATE INDEX idx_trade_analysis_asset ON public.trade_analysis(asset);
CREATE INDEX idx_trade_analysis_direction ON public.trade_analysis(direction);
