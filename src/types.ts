
export type TradeIdea = {
  id: string;
  created_at: string;
  title: string;
  instrument: string;
  breakdown: string;
  image_url: string | null;
  tags: string[] | null;
  profile_id: string | null;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};
