
import { Twitter, Instagram, Link, BarChart, BookOpen, ShoppingCart } from 'lucide-react';

export type TradeIdea = {
  id: number; // Changed from string to number to match database bigint
  created_at: string;
  title: string;
  instrument: string;
  breakdown: string[]; // Changed to array of strings for pagination
  image_url: string | null;
  tags: string[] | null;
  user_id: string | null;
  status: string;
  entry_price: string | null;
  target_price: string | null;
  stop_loss: string | null;
  risk_reward: string | null;
  sentiment: string | null;
  key_points: string[] | null;
  direction: string | null;
  is_pinned: boolean;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes?: { count: number }[];
};

export type Comment = {
  id: string;
  created_at: string;
  content: string;
  trade_idea_id: string;
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  updated_at: string;
  is_banned?: boolean;
  is_admin?: boolean;
  email?: string | null;
};

export type Ad = {
  id: number;
  created_at: string;
  user_id: string;
  title: string;
  content: string;
  link_url: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  status: 'pending_payment' | 'pending_approval' | 'approved' | 'rejected';
  start_date: string | null;
  end_date: string | null;
  cost: number | null;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

export type AffiliateLink = {
  id: number;
  created_at: string;
  title: string;
  description: string;
  url: string;
};
