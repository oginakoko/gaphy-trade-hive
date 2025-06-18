import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    username: string;
    avatar_url?: string;
  };
  recipient?: {
    username: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string;
  other_user_is_admin?: boolean; // Added to indicate if the other user is an admin
  is_support_chat: boolean; // Added to indicate if this is a support chat
  last_message?: Message;
  messages: Message[];
  unread_count: number;
}

export function useMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setConversations([]);
      return;
    }
    
    try {      const { data: messages, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender:profiles!user_id(username, avatar_url, is_admin),
          recipient:profiles!user_id(username, avatar_url, is_admin)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!messages) {
        setConversations([]);
        return;
      }

      // Group messages by conversation (other user)
      const conversationsMap = new Map<string, Conversation>();
      
      messages.forEach(message => {
        const isUserSender = message.sender_id === user.id;
        const otherUserId = isUserSender ? message.recipient_id : message.sender_id;
        const otherUser = isUserSender ? message.recipient : message.sender;

        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            other_user_id: otherUserId,
            other_user_name: otherUser.username,
            other_user_avatar: otherUser.avatar_url,
            other_user_is_admin: otherUser.is_admin, // Populate new field
            is_support_chat: otherUser.is_admin, // Mark as support chat if other user is admin
            messages: [],
            unread_count: 0
          });
        }

        const conversation = conversationsMap.get(otherUserId)!;
        conversation.messages.push({
          id: message.id,
          sender_id: message.sender_id,
          recipient_id: message.recipient_id,
          content: message.content,
          created_at: message.created_at,
          is_read: message.is_read,
          sender: message.sender,
          recipient: message.recipient
        });

        // Update unread count and last message
        if (!message.is_read && message.recipient_id === user.id) {
          conversation.unread_count++;
        }
        if (!conversation.last_message || new Date(message.created_at) > new Date(conversation.last_message.created_at)) {
          conversation.last_message = message;
        }
      });

      setConversations(Array.from(conversationsMap.values()).sort((a, b) => 
        new Date(b.last_message?.created_at || 0).getTime() - 
        new Date(a.last_message?.created_at || 0).getTime()
      ));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const sendMessage = async ({ recipient_id, content }: { recipient_id: string; content: string }) => {
    if (!user?.id) return;
    
    try {      const { data: message, error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          recipient_id,
          content,
        })
        .select(`
          *,
          sender:profiles!user_id(username, avatar_url, is_admin),
          recipient:profiles!user_id(username, avatar_url, is_admin)
        `)
        .single();

      if (error) throw error;

      setConversations(prev => {
        const conversationIndex = prev.findIndex(c => c.other_user_id === recipient_id);
        if (conversationIndex === -1) {
          // Create new conversation
          return [{
            other_user_id: recipient_id,
            other_user_name: message.recipient.username,
            other_user_avatar: message.recipient.avatar_url,
            messages: [message],
            last_message: message,
            unread_count: 0
          }, ...prev];
        }

        // Update existing conversation
        const updated = [...prev];
        updated[conversationIndex] = {
          ...updated[conversationIndex],
          messages: [message, ...updated[conversationIndex].messages],
          last_message: message
        };
        return updated;
      });

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const markAsRead = async (userId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('private_messages')
        .update({ is_read: true })
        .match({ sender_id: userId, recipient_id: user.id, is_read: false });

      if (error) throw error;

      setConversations(prev => 
        prev.map(conv => 
          conv.other_user_id === userId 
            ? {
                ...conv,
                unread_count: 0,
                messages: conv.messages.map(msg => 
                  msg.sender_id === userId ? { ...msg, is_read: true } : msg
                )
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('private_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
        filter: `recipient_id=eq.${user.id}`
      }, async (payload) => {
        // Fetch the complete message with user details
        const { data: message, error } = await supabase
          .from('private_messages')
          .select(`
            *,
            sender:profiles!private_messages_sender_id_fkey(username, avatar_url),
            recipient:profiles!private_messages_recipient_id_fkey(username, avatar_url)
          `)
          .eq('id', payload.new.id)
          .single();

        if (error || !message) return;

        setConversations(prev => {
          const conversationIndex = prev.findIndex(c => c.other_user_id === message.sender_id);
          if (conversationIndex === -1) {
            // Create new conversation
            return [{
              other_user_id: message.sender_id,
              other_user_name: message.sender.username,
              other_user_avatar: message.sender.avatar_url,
              messages: [message],
              last_message: message,
              unread_count: 1
            }, ...prev];
          }

          // Update existing conversation
          const updated = [...prev];
          updated[conversationIndex] = {
            ...updated[conversationIndex],
            messages: [message, ...updated[conversationIndex].messages],
            last_message: message,
            unread_count: updated[conversationIndex].unread_count + 1
          };
          return updated;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    sendMessage,
    markAsRead,
    refetch: fetchConversations
  };
}
