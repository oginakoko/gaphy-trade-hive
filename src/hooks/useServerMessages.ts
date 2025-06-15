
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
  const { mentioned_users, ...messageToInsert } = messageData;
  const { data, error } = await supabase
    .from('server_messages')
    .insert(messageToInsert)
    .select('*, profiles(username, avatar_url)')
    .single();

  if (error) throw new Error(error.message);

  if (data && mentioned_users && mentioned_users.length > 0) {
    const notifications = mentioned_users.map(mentionedId => ({
      recipient_id: mentionedId,
      sender_id: messageData.user_id,
      type: 'mention',
      reference_id: data.id,
      server_id: messageData.server_id,
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);
    
    if (notificationError) {
      console.error('Failed to create notifications:', notificationError);
    }
  }

  return data;
};

const deleteMessage = async (messageId: string) => {
  const { error } = await supabase
    .from('server_messages')
    .delete()
    .eq('id', messageId);

  if (error) throw new Error(error.message);
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
