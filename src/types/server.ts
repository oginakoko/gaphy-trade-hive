
export interface Server {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  owner_id: string;
  created_at: string;
  is_public: boolean;
  member_count?: number;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role: 'owner' | 'moderator' | 'member';
  joined_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ServerMessage {
  id: string;
  server_id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video' | 'audio' | 'document' | null;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  parent_message_id?: string | null;
  parent_message?: {
    id: string;
    content: string | null;
    profiles: {
      username: string | null;
    } | null;
  } | null;
}
