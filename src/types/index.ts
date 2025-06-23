export interface TradeIdea {
  id: number;
  title: string;
  instrument: string;
  breakdown: string;
  image_url: string | null;
  tags: string[];
  status: 'open' | 'closed' | 'cancelled';
  entry_price: number | null;
  target_price: number | null;
  stop_loss: number | null;
  risk_reward: number | null;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral' | null;
  key_points: string[];
  direction: 'Long' | 'Short' | null;
  is_pinned: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}