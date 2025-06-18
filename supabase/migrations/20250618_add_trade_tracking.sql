-- Create trade tracking table
CREATE TABLE IF NOT EXISTS public.trade_tracking (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_idea_id uuid REFERENCES public.trade_ideas(id),
    asset TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('Long', 'Short')),
    entry_price DECIMAL,
    exit_price DECIMAL,
    target_price DECIMAL,
    stop_loss DECIMAL,
    risk_reward DECIMAL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    user_id uuid REFERENCES public.profiles(id) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.trade_tracking ENABLE ROW LEVEL SECURITY;

-- Everyone can view trades
CREATE POLICY "Everyone can view trades"
ON public.trade_tracking
FOR SELECT
USING (true);

-- Only owner can insert
CREATE POLICY "Users can insert their own trades"
ON public.trade_tracking
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only owner can update
CREATE POLICY "Users can update their own trades"
ON public.trade_tracking
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_trade_tracking_user ON public.trade_tracking(user_id);
CREATE INDEX idx_trade_tracking_asset ON public.trade_tracking(asset);
CREATE INDEX idx_trade_tracking_status ON public.trade_tracking(status);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to update updated_at
CREATE TRIGGER update_trade_tracking_updated_at
    BEFORE UPDATE ON public.trade_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
