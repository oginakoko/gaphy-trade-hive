
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { ServerMessage } from '@/types/server';

const fetchServerMessages = async (serverId: string): Promise<ServerMessage[]> => {
  const { data, error } = await supabase
    .from('server_messages')
    .select('*, profiles(username, avatar_url), parent_message:server_messages!parent_message_id(id, content, profiles(username))')
    .eq('server_id', serverId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data as ServerMessage[];
};

const sendMessage = async (messageData: {
  server_id: string;
  user_id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio' | 'document';
  parent_message_id?: string | null;
}) => {
  const { data, error } = await supabase
    .from('server_messages')
    .insert(messageData)
    .select('*, profiles(username, avatar_url), parent_message:server_messages!parent_message_id(id, content, profiles(username))')
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw new Error(error.message || 'An unknown error occurred when sending the message.');
  }
  
  return data;
};

const deleteMessage = async (messageId: string) => {
  const { error } = await supabase
    .from('server_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting message:', error);
    throw new Error(error.message || 'An unknown error occurred when deleting the message.');
  }
};

export const useServerMessages = (serverId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['serverMessages', serverId],
    queryFn: () => fetchServerMessages(serverId),
    enabled: !!serverId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (newMessage: Omit<Parameters<typeof sendMessage>[0], 'user_id'>) => {
      if (!user) throw new Error("User not authenticated");
      return sendMessage({ ...newMessage, user_id: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverMessages', serverId] });
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      // Optionally show a toast to the user
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: deleteMessage,
    onMutate: async (messageId: string) => {
        await queryClient.cancelQueries({ queryKey: ['serverMessages', serverId] });
        const previousMessages = queryClient.getQueryData(['serverMessages', serverId]);
        queryClient.setQueryData(
          ['serverMessages', serverId],
          (old: ServerMessage[] | undefined) => old ? old.filter(m => m.id !== messageId) : []
        );
        return { previousMessages };
    },
    onError: (err, variables, context) => {
        if (context?.previousMessages) {
            queryClient.setQueryData(['serverMessages', serverId], context.previousMessages);
        }
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['serverMessages', serverId] });
    },
  });

  return {
    messages: messages || [],
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    deleteMessage: deleteMessageMutation.mutate,
    isDeleting: deleteMessageMutation.isPending,
  };
};
