
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { Conversation, Message } from '@/types/chat';

export function useMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading: loading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: messages, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender:profiles!private_messages_sender_id_fkey(id, username, avatar_url, is_admin),
          recipient:profiles!private_messages_recipient_id_fkey(id, username, avatar_url, is_admin)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>();

      messages?.forEach((msg) => {
        const isFromUser = msg.sender_id === user.id;
        const otherUser = isFromUser ? msg.recipient : msg.sender;
        const otherUserId = isFromUser ? msg.recipient_id : msg.sender_id;

        if (!otherUser || !otherUserId) return;

        const conversationKey = otherUserId;

        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            other_user_id: otherUserId,
            other_user_name: otherUser.username || 'Unknown User',
            other_user_avatar: otherUser.avatar_url,
            other_user: otherUser,
            messages: [],
            unread_count: 0,
            last_message: undefined,
            is_support_chat: otherUser.is_admin
          });
        }

        const conversation = conversationMap.get(conversationKey)!;
        
        const messageObj: Message = {
          id: msg.id.toString(),
          content: msg.content,
          sender_id: msg.sender_id || '',
          recipient_id: msg.recipient_id || '',
          created_at: msg.created_at || '',
          is_read: msg.is_read || false,
          sender: msg.sender,
          recipient: msg.recipient
        };

        conversation.messages.push(messageObj);

        // Set last message and count unread
        if (!conversation.last_message || new Date(msg.created_at || '') > new Date(conversation.last_message.created_at)) {
          conversation.last_message = messageObj;
        }

        if (!msg.is_read && msg.recipient_id === user.id) {
          conversation.unread_count++;
        }
      });

      // Sort messages within each conversation
      conversationMap.forEach(conversation => {
        conversation.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });

      return Array.from(conversationMap.values()).sort((a, b) => {
        const aTime = a.last_message ? new Date(a.last_message.created_at).getTime() : 0;
        const bTime = b.last_message ? new Date(b.last_message.created_at).getTime() : 0;
        return bTime - aTime;
      });
    },
    enabled: !!user?.id
  });

  // Send message mutation
  const { mutateAsync: sendMessage } = useMutation({
    mutationFn: async ({ recipient_id, content, is_broadcast = false }: { 
      recipient_id: string; 
      content: string; 
      is_broadcast?: boolean 
    }) => {
      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user?.id,
          recipient_id,
          content,
          is_broadcast
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        description: 'Message sent successfully',
      });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  });

  // Mark as read mutation
  const { mutateAsync: markAsRead } = useMutation({
    mutationFn: async (otherUserId: string) => {
      const { error } = await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('recipient_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  // Broadcast message mutation (admin only)
  const { mutateAsync: sendBroadcastMessage } = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      // Get all users except current user
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', user?.id);

      if (usersError) throw usersError;

      // Send message to each user
      const promises = users?.map(async (targetUser) => {
        return supabase
          .from('private_messages')
          .insert({
            sender_id: user?.id,
            recipient_id: targetUser.id,
            content,
            is_broadcast: true
          });
      }) || [];

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to send ${errors.length} messages`);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        description: 'Broadcast message sent to all users',
      });
    },
    onError: (error) => {
      console.error('Error sending broadcast:', error);
      toast({
        title: 'Error',
        description: 'Failed to send broadcast message',
        variant: 'destructive',
      });
    }
  });

  return {
    conversations,
    loading,
    sendMessage,
    markAsRead,
    sendBroadcastMessage
  };
}
