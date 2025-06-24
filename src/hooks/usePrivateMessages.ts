import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { PrivateMessage } from '@/types/messages';

export const usePrivateMessages = (recipientId?: string, threadId?: number) => {
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['privateMessages', recipientId, threadId],
    enabled: Boolean(recipientId || threadId),
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
  });

  const { mutateAsync: sendMessage } = useMutation({
    mutationFn: async (message: Omit<PrivateMessage, 'id' | 'sender_id' | 'created_at'>) => {
      // ✅ 1) ALWAYS get the live session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session || !session.user) throw new Error('Not signed in');

      const sender_id = session.user.id;

      console.log('Using sender_id:', sender_id);

      // ✅ 2) Insert with correct sender_id
      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          ...message,
          sender_id
        })
        .single(); // no .select(), just .single()

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['privateMessages', recipientId, threadId]);
    }
  });

  const { mutateAsync: markAsRead } = useMutation({
    mutationFn: async (messageId: number) => {
      const { data, error } = await supabase
        .from('private_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['privateMessages', recipientId, threadId]);
    }
  });

  return {
    messages: messages || [],
    isLoading,
    sendMessage,
    markAsRead
  };
};
