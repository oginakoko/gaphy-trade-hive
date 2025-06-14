export type TradeIdea = {
  id: string;
  created_at: string;
  title: string;
  instrument: string;
  breakdown: string;
  image_url: string | null;
  tags: string[] | null;
  user_id: string | null;
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
};

export type Ad = {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  content: string;
  link_url: string;
  image_url: string | null;
  status: 'pending_approval' | 'approved' | 'rejected';
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};
