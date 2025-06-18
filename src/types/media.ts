
export interface TradeIdeaMedia {
  id: string;
  trade_idea_id: number;
  media_type: 'video' | 'image' | 'link';
  url: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  position: number;
  created_at: string;
}

export interface MediaItem {
  id: string;
  type: 'video' | 'image' | 'link';
  url: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  file?: File;
}
