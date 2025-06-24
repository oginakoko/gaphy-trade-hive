export interface PrivateMessage {
  id: number;
  sender_id: string;
  recipient_id: string;
  content: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | 'audio' | 'document' | null;
  created_at: string;
  updated_at: string;
  read_at?: string | null;
  thread_id?: number | null;
  is_edited: boolean;
  // Join with profiles
  sender?: {
    username: string | null;
    avatar_url: string | null;
    is_admin?: boolean;
  };
  recipient?: {
    username: string | null;
    avatar_url: string | null;
    is_admin?: boolean;
  };
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  filename?: string;
  created_at: string;
}

export interface UserFollow {
  id: number;
  follower_id: string;
  following_id: string;
  created_at: string;
  // Join with profiles
  follower?: {
    username: string | null;
    avatar_url: string | null;
  };
  following?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export interface UnreadCount {
  id: number;
  user_id: string;
  unread_count: number;
  last_checked_at: string;
}
