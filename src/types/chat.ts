export interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  is_read: boolean;
  is_broadcast?: boolean;
  sender?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    is_admin?: boolean;
  };
  recipient?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    is_admin?: boolean;
  };
}

export interface Conversation {
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string;
  other_user?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    is_admin: boolean;
    email?: string | null;
  };
  last_message?: Message;
  messages: Message[];
  unread_count: number;
  is_support_chat?: boolean;
  is_blocked_by_me?: boolean;
  is_blocked_by_other?: boolean;
}
