export interface TradeIdeaMedia {
  id: number;
  trade_idea_id: number;
  media_type: 'video' | 'image' | 'link';
  url: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  position: number;
  created_at: string;
  placeholder_id?: string;
}

export interface MediaItem {
  id: string; // This remains string as it's used for placeholders
  type: 'video' | 'image' | 'link';
  url: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  file?: File;
}
