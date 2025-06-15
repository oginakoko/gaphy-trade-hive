import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { ServerMessage } from '@/types/server';

const fetchServerMessages = async (serverId: string): Promise<ServerMessage[]> => {
  const { data, error } = await supabase
    .from('server_messages')
    .select('*, profiles(username, avatar_url)')
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
  mentioned_users?: string[];
}) => {
  const { data, error } = await supabase.functions.invoke('send-server-message', {
    body: { messageData },
  });

  if (error) {
    console.error('Error invoking send-server-message function:', error);
    throw new Error(error.message || 'An unknown error occurred when sending the message.');
  }
  
  // The edge function returns an object with a 'data' property containing the new message
  return data.data;
};

const deleteMessage = async (messageId: string) => {
  const { data, error } = await supabase.functions.invoke('delete-server-message', {
    body: { messageId },
  });

  if (error) throw new Error(error.message);
  return data;
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
  });

  const deleteMessageMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
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
