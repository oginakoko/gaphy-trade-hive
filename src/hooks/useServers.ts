
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Server, ServerMember } from '@/types/server';

const fetchPublicServers = async (): Promise<Server[]> => {
  const { data, error } = await supabase
    .from('servers')
    .select('*, profiles(username, avatar_url)')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Server[];
};

const fetchUserServers = async (userId: string): Promise<Server[]> => {
  const { data, error } = await supabase
    .from('server_members')
    .select('servers(*, profiles(username, avatar_url))')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return data.map(item => item.servers).filter(Boolean) as Server[];
};

const createServer = async (serverData: {
  name: string;
  description: string;
  image_url?: string;
  is_public: boolean;
}) => {
  const { data, error } = await supabase
    .from('servers')
    .insert(serverData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('server_members')
    .insert({
      server_id: data.id,
      user_id: data.owner_id,
      role: 'admin'
    });

  if (memberError) throw new Error(memberError.message);
  return data;
};

const joinServer = async (serverId: string, userId: string) => {
  const { error } = await supabase
    .from('server_members')
    .insert({
      server_id: serverId,
      user_id: userId,
      role: 'member'
    });

  if (error) throw new Error(error.message);
};

export const useServers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: publicServers, isLoading: isLoadingPublic } = useQuery({
    queryKey: ['publicServers'],
    queryFn: fetchPublicServers,
  });

  const { data: userServers, isLoading: isLoadingUser } = useQuery({
    queryKey: ['userServers', user?.id],
    queryFn: () => fetchUserServers(user!.id),
    enabled: !!user,
  });

  const createServerMutation = useMutation({
    mutationFn: createServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicServers'] });
      queryClient.invalidateQueries({ queryKey: ['userServers'] });
    },
  });

  const joinServerMutation = useMutation({
    mutationFn: ({ serverId }: { serverId: string }) => 
      joinServer(serverId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userServers'] });
    },
  });

  return {
    publicServers: publicServers || [],
    userServers: userServers || [],
    isLoading: isLoadingPublic || isLoadingUser,
    createServer: createServerMutation.mutate,
    joinServer: joinServerMutation.mutate,
    isCreating: createServerMutation.isPending,
    isJoining: joinServerMutation.isPending,
  };
};
