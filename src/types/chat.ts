export interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  is_read: boolean;
}

export interface Conversation {
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string;
  last_message?: Message;
  messages: Message[];
  unread_count: number;
}
