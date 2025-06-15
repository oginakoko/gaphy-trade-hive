
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
}) => {
  const { data, error } = await supabase
    .from('server_messages')
    .insert(messageData)
    .select('*, profiles(username, avatar_url)')
    .single();

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

  return {
    messages: messages || [],
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
};
