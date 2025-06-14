
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
