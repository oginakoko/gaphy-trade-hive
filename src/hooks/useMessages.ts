import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export function useMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading: loading } = useQuery({
    queryKey: ['conversations', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: messages, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id},is_broadcast.eq.true`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(messages.flatMap(msg => [msg.sender_id, msg.recipient_id]))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_admin')
        .in('id', userIds);
      if (profilesError) throw profilesError;

      const profilesMap = new Map(profiles.map(p => [p.id, p]));
      const conversationMap = new Map();

      for (const msg of messages) {
        const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        if (!otherId) continue;
        const otherProfile = profilesMap.get(otherId);
        if (!otherProfile) continue;

        if (!conversationMap.has(otherId)) {
          conversationMap.set(otherId, {
            other_user_id: otherId,
            other_user_name: otherProfile.username,
            other_user_avatar: otherProfile.avatar_url,
            other_user: otherProfile,
            messages: [],
            unread_count: 0,
            last_message: null,
            is_support_chat: otherProfile.is_admin,
          });
        }

        const conv = conversationMap.get(otherId);
        conv.messages.push({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          recipient_id: msg.recipient_id,
          created_at: msg.created_at,
          is_read: msg.is_read,
          is_broadcast: msg.is_broadcast,
          sender: profilesMap.get(msg.sender_id),
          recipient: profilesMap.get(msg.recipient_id),
        });

        if (!conv.last_message || new Date(msg.created_at) > new Date(conv.last_message.created_at)) {
          conv.last_message = msg;
        }

        if (!msg.is_read && msg.recipient_id === user.id) {
          conv.unread_count++;
        }
      }

      return Array.from(conversationMap.values()).sort((a, b) => {
        const aTime = new Date(a.last_message?.created_at || 0);
        const bTime = new Date(b.last_message?.created_at || 0);
        return bTime - aTime;
      });
    },
  });

  const { mutateAsync: sendMessage } = useMutation({
    mutationFn: async ({ recipient_id, content, is_broadcast = false }) => {
      // ✅ ALWAYS grab live session at runtime
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session || !session.user) throw new Error('Not signed in');

      const sender_id = session.user.id;

      // Check block status
      const { data: blockData, error: blockError } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', recipient_id)
        .eq('blocked_id', sender_id)
        .maybeSingle();

      if (blockError && blockError.code !== 'PGRST116') throw blockError;
      if (blockData) throw new Error('You are blocked by this user.');

      // Insert message with valid sender_id
      const { data: message, error: messageError } = await supabase
        .from('private_messages')
        .insert({ sender_id, recipient_id, content: content.trim(), is_broadcast })
        .single();

      if (messageError) throw messageError;

      // Optionally get profiles
      const [{ data: sender }, { data: recipient }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', sender_id).single(),
        supabase.from('profiles').select('*').eq('id', recipient_id).single(),
      ]);

      return { ...message, sender, recipient };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations', user?.id]);
      toast({ description: 'Message sent' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send',
        variant: 'destructive',
      });
    },
  });

  const { mutateAsync: markAsRead } = useMutation({
    mutationFn: async (otherUserId) => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session || !session.user) throw new Error('Not signed in');

      const user_id = session.user.id;

      const { error } = await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('recipient_id', user_id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['conversations', user?.id]),
  });

  const { mutateAsync: sendBroadcastMessage } = useMutation({
    mutationFn: async ({ content }) => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session || !session.user) throw new Error('Not signed in');

      const sender_id = session.user.id;

      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', sender_id);
      if (usersError) throw usersError;

      const messages = users.map(u => ({
        sender_id,
        recipient_id: u.id,
        content,
        is_broadcast: true,
      }));

      const { error } = await supabase
        .from('private_messages')
        .insert(messages);

      if (error) throw error;

      return { success: true, count: messages.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations', user?.id]);
      toast({ description: 'Broadcast sent' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send broadcast',
        variant: 'destructive',
      });
    },
  });

  return {
    conversations,
    loading,
    sendMessage,
    markAsRead,
    sendBroadcastMessage,
  };
}
