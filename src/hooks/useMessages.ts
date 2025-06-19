import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { Conversation, Message } from '@/types/chat';
import type { User } from '@supabase/supabase-js';
import { UseMutateAsyncFunction } from '@tanstack/react-query';

// Define the return type of the hook for clarity and type safety
interface UseMessagesReturn {
  conversations: Conversation[];
  loading: boolean;
  sendMessage: UseMutateAsyncFunction<any, Error, { recipient_id: string; content: string; is_broadcast?: boolean; }, unknown>;
  markAsRead: UseMutateAsyncFunction<any, Error, string, unknown>;
  sendBroadcastMessage: UseMutateAsyncFunction<any, Error, { content: string; }, unknown>;
}

export function useMessages(): UseMessagesReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading: loading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get all private messages
      const { data: messages, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id},is_broadcast.eq.true`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      // Then get all user profiles involved in the conversations
      const userIds = messages?.reduce((acc: Set<string>, msg) => {
        if (msg.sender_id) acc.add(msg.sender_id);
        if (msg.recipient_id) acc.add(msg.recipient_id);
        return acc;
      }, new Set<string>());

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(userIds || []));

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      const profilesMap = new Map(profiles?.map(p => [p.id, p]));

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>();

      messages?.forEach((msg) => {
        const isFromUser = msg.sender_id === user.id;
        const otherUserId = isFromUser ? msg.recipient_id : msg.sender_id;
        if (!otherUserId) return;

        const otherUser = profilesMap.get(otherUserId);
        if (!otherUser) return;

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
          sender: profilesMap.get(msg.sender_id || ''),
          recipient: profilesMap.get(msg.recipient_id || ''),
          is_broadcast: msg.is_broadcast || false
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

  const { mutateAsync: sendMessage } = useMutation({
    mutationFn: async ({ recipient_id, content, is_broadcast = false }: { 
      recipient_id: string; 
      content: string; 
      is_broadcast?: boolean 
    }) => {
      if (!user?.id || !content.trim()) throw new Error('Invalid message data');

      // Get recipient profile first
      const { data: recipient, error: recipientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', recipient_id)
        .single();

      if (recipientError) throw recipientError;

      // Send the message
      const { data: message, error: messageError } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          recipient_id,
          content: content.trim(),
          is_broadcast
        })
        .select('*')
        .single();

      if (messageError) {
        console.error('Error sending message:', messageError);
        throw messageError;
      }

      // Get sender profile
      const { data: sender } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        ...message,
        sender,
        recipient
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      toast({
        description: 'Message sent successfully',
      });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    }
  });

  const { mutateAsync: markAsRead } = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    }
  });

  // Broadcast message mutation (admin only)
  const { mutateAsync: sendBroadcastMessage } = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get all users except current user
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', user.id);

      if (usersError) throw usersError;

      // Send broadcast messages in batches
      const messages = users?.map(targetUser => ({
        sender_id: user.id,
        recipient_id: targetUser.id,
        content,
        is_broadcast: true
      })) || [];

      // Insert all messages at once
      const { error } = await supabase
        .from('private_messages')
        .insert(messages);

      if (error) {
        console.error('Error sending broadcast messages:', error);
        throw error;
      }

      return { success: true, count: messages.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      toast({
        description: 'Broadcast message sent to all users',
      });
    },
    onError: (error) => {
      console.error('Error sending broadcast:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send broadcast message',
        variant: 'destructive',
      });
    }
  });

  return {
    conversations,
    loading,
    sendMessage,
    markAsRead,
    sendBroadcastMessage, // Add sendBroadcastMessage to the returned object
  };
}
