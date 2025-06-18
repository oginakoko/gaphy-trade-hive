import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { PrivateMessage } from '@/types/messages';

// Fetch messages between two users or for a thread
export const usePrivateMessages = (recipientId?: string, threadId?: number) => {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['privateMessages', recipientId, threadId],
    queryFn: async () => {
      const query = supabase
        .from('private_messages')
        .select(`
          *,
          sender:profiles!private_messages_sender_id_fkey(username, avatar_url),
          recipient:profiles!private_messages_recipient_id_fkey(username, avatar_url)
        `)
        .order('created_at', { ascending: true });

      if (threadId) {
        query.eq('thread_id', threadId);
      } else if (recipientId) {
        query.or(`sender_id.eq.${recipientId},recipient_id.eq.${recipientId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PrivateMessage[];
    },
    enabled: Boolean(recipientId || threadId)
  });

  const { mutateAsync: sendMessage } = useMutation({
    mutationFn: async (message: Partial<PrivateMessage>) => {
      const { data, error } = await supabase
        .from('private_messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { mutateAsync: markAsRead } = useMutation({
    mutationFn: async (messageId: number) => {
      const { data, error } = await supabase
        .from('private_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  });

  return {
    messages: messages || [],
    isLoading,
    sendMessage,
    markAsRead
  };
};
