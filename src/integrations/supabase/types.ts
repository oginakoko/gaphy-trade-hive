export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ads: {
        Row: {
          content: string | null
          cost: number | null
          created_at: string
          end_date: string | null
          id: number
          link_url: string | null
          media_type: string | null
          media_url: string | null
          payment_method: string | null
          payment_proof_url: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["ad_status"]
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          cost?: number | null
          created_at?: string
          end_date?: string | null
          id?: number
          link_url?: string | null
          media_type?: string | null
          media_url?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          title: string
          user_id: string
        }
        Update: {
          content?: string | null
          cost?: number | null
          created_at?: string
          end_date?: string | null
          id?: number
          link_url?: string | null
          media_type?: string | null
          media_url?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: number
          trade_idea_id: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          trade_idea_id: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          trade_idea_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_trade_idea_id_fkey"
            columns: ["trade_idea_id"]
            isOneToOne: false
            referencedRelation: "trade_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: number
          trade_idea_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          trade_idea_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          trade_idea_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_trade_idea_id_fkey"
            columns: ["trade_idea_id"]
            isOneToOne: false
            referencedRelation: "trade_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string | null
          filename: string | null
          id: number
          message_id: number | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          filename?: string | null
          id?: never
          message_id?: number | null
          type: string
          url: string
        }
        Update: {
          created_at?: string | null
          filename?: string | null
          id?: never
          message_id?: number | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "private_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_transactions: {
        Row: {
          ad_id: number | null
          amount: number
          checkout_request_id: string
          created_at: string
          id: number
          merchant_request_id: string
          mpesa_receipt_number: string | null
          phone_number: string
          result_desc: string | null
          status: string
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          ad_id?: number | null
          amount: number
          checkout_request_id: string
          created_at?: string
          id?: number
          merchant_request_id: string
          mpesa_receipt_number?: string | null
          phone_number: string
          result_desc?: string | null
          status?: string
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          ad_id?: number | null
          amount?: number
          checkout_request_id?: string
          created_at?: string
          id?: number
          merchant_request_id?: string
          mpesa_receipt_number?: string | null
          phone_number?: string
          result_desc?: string | null
          status?: string
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_transactions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          reference_id: string | null
          sender_id: string
          server_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          reference_id?: string | null
          sender_id: string
          server_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          reference_id?: string | null
          sender_id?: string
          server_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      private_messages: {
        Row: {
          content: string
          created_at: string | null
          id: number
          is_broadcast: boolean | null
          is_read: boolean | null
          recipient_id: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: never
          is_broadcast?: boolean | null
          is_read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: never
          is_broadcast?: boolean | null
          is_read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          id: string
          is_admin: boolean
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          id: string
          is_admin?: boolean
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      server_members: {
        Row: {
          id: number
          joined_at: string
          role: Database["public"]["Enums"]["server_role"]
          server_id: string
          user_id: string
        }
        Insert: {
          id?: number
          joined_at?: string
          role?: Database["public"]["Enums"]["server_role"]
          server_id: string
          user_id: string
        }
        Update: {
          id?: number
          joined_at?: string
          role?: Database["public"]["Enums"]["server_role"]
          server_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_members_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "server_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      server_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          media_type: Database["public"]["Enums"]["media_type"] | null
          media_url: string | null
          parent_message_id: string | null
          server_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          parent_message_id?: string | null
          server_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          parent_message_id?: string | null
          server_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_messages_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "server_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      servers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_public: boolean
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          name: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      short_urls: {
        Row: {
          createdat: string
          id: string
          originalurl: string
          shortcode: string
        }
        Insert: {
          createdat?: string
          id?: string
          originalurl: string
          shortcode: string
        }
        Update: {
          createdat?: string
          id?: string
          originalurl?: string
          shortcode?: string
        }
        Relationships: []
      }
      shortlinks: {
        Row: {
          clicks: number | null
          created_at: string
          id: string
          original_url: string
          short_code: string
          type: string
        }
        Insert: {
          clicks?: number | null
          created_at?: string
          id?: string
          original_url: string
          short_code: string
          type: string
        }
        Update: {
          clicks?: number | null
          created_at?: string
          id?: string
          original_url?: string
          short_code?: string
          type?: string
        }
        Relationships: []
      }
      trade_analysis: {
        Row: {
          analyzed_text: string
          asset: string | null
          created_at: string
          direction: string | null
          entry_price: number | null
          exit_price: number | null
          id: string
          key_points: string[] | null
          risk_reward: number | null
          sentiment: string | null
          stop_loss: number | null
          target_price: number | null
          trade_idea_id: number | null
          updated_at: string
        }
        Insert: {
          analyzed_text: string
          asset?: string | null
          created_at?: string
          direction?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          key_points?: string[] | null
          risk_reward?: number | null
          sentiment?: string | null
          stop_loss?: number | null
          target_price?: number | null
          trade_idea_id?: number | null
          updated_at?: string
        }
        Update: {
          analyzed_text?: string
          asset?: string | null
          created_at?: string
          direction?: string | null
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          key_points?: string[] | null
          risk_reward?: number | null
          sentiment?: string | null
          stop_loss?: number | null
          target_price?: number | null
          trade_idea_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_analysis_trade_idea_id_fkey"
            columns: ["trade_idea_id"]
            isOneToOne: false
            referencedRelation: "trade_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_idea_media: {
        Row: {
          created_at: string
          description: string | null
          id: string
          media_type: string
          placeholder_id: string | null
          position: number
          thumbnail_url: string | null
          title: string | null
          trade_idea_id: number
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          media_type: string
          placeholder_id?: string | null
          position?: number
          thumbnail_url?: string | null
          title?: string | null
          trade_idea_id: number
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          media_type?: string
          placeholder_id?: string | null
          position?: number
          thumbnail_url?: string | null
          title?: string | null
          trade_idea_id?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_trade_idea_media_trade_idea"
            columns: ["trade_idea_id"]
            isOneToOne: false
            referencedRelation: "trade_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_ideas: {
        Row: {
          breakdown: string | null
          created_at: string
          id: number
          image_url: string | null
          instrument: string
          profile_id: string | null
          tags: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          breakdown?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          instrument: string
          profile_id?: string | null
          tags?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          breakdown?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          instrument?: string
          profile_id?: string | null
          tags?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unread_message_counts: {
        Row: {
          id: number
          last_checked_at: string | null
          unread_count: number | null
          user_id: string | null
        }
        Insert: {
          id?: never
          last_checked_at?: string | null
          unread_count?: number | null
          user_id?: string | null
        }
        Update: {
          id?: never
          last_checked_at?: string | null
          unread_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string | null
          following_id: string | null
          id: number
        }
        Insert: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: never
        }
        Update: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: never
        }
        Relationships: []
      }
      verifications: {
        Row: {
          broker_name: string | null
          created_at: string
          id: string
          image_path: string
          status: string
          type: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          broker_name?: string | null
          created_at?: string
          id?: string
          image_path: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          broker_name?: string | null
          created_at?: string
          id?: string
          image_path?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_short_code: {
        Args: { length?: number }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_server_member: {
        Args: { p_server_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      ad_status:
        | "pending"
        | "approved"
        | "rejected"
        | "pending_payment"
        | "pending_approval"
      media_type: "image" | "video" | "audio" | "document"
      server_role: "admin" | "moderator" | "member" | "owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ad_status: [
        "pending",
        "approved",
        "rejected",
        "pending_payment",
        "pending_approval",
      ],
      media_type: ["image", "video", "audio", "document"],
      server_role: ["admin", "moderator", "member", "owner"],
    },
  },
} as const
