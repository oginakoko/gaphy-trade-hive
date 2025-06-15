import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Server, ServerMember } from '@/types/server';

const fetchPublicServers = async (): Promise<Server[]> => {
  const { data, error } = await supabase
    .from('servers')
    .select('*, profiles!owner_id(username, avatar_url)')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  return data as Server[];
};

const fetchUserServers = async (userId: string): Promise<Server[]> => {
  const { data, error } = await supabase
    .from('server_members')
    .select('servers!inner(*, profiles!owner_id(username, avatar_url))')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  if (!data) return [];

  const servers = data.map(item => item.servers).filter(Boolean);

  return servers as Server[];
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

const leaveServer = async ({ serverId, userId }: { serverId: string; userId: string }) => {
  const { data: server, error: serverError } = await supabase
    .from('servers')
    .select('owner_id')
    .eq('id', serverId)
    .single();

  if (serverError) throw new Error(serverError.message);

  if (server.owner_id === userId) {
    throw new Error("Server owner cannot leave. You can delete the server instead.");
  }

  const { error } = await supabase
    .from('server_members')
    .delete()
    .eq('server_id', serverId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
};

const updateServer = async (serverData: {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  is_public: boolean;
}) => {
  const { id, ...updateData } = serverData;
  const { data, error } = await supabase
    .from('servers')
    .update(updateData)
    .eq('id', id)
    .select('*, profiles!owner_id(username, avatar_url)')
    .single();

  if (error) throw new Error(error.message);
  return data as Server;
};

const deleteServer = async (serverId: string) => {
  // This currently only deletes the server record. For a production app,
  // you should set up database cascades or an edge function to also delete
  // related members, messages, and files in storage.
  const { error } = await supabase.from('servers').delete().eq('id', serverId);

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
      queryClient.invalidateQueries({ queryKey: ['publicServers'] });
    },
  });

  const leaveServerMutation = useMutation({
    mutationFn: ({ serverId }: { serverId: string }) => {
        if (!user) throw new Error("User not authenticated");
        return leaveServer({ serverId, userId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userServers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['publicServers'] });
    },
  });

  const updateServerMutation = useMutation({
    mutationFn: updateServer,
    onSuccess: (updatedServer) => {
      queryClient.invalidateQueries({ queryKey: ['publicServers'] });
      queryClient.invalidateQueries({ queryKey: ['userServers', user?.id] });
    },
  });

  const deleteServerMutation = useMutation({
    mutationFn: deleteServer,
    onSuccess: (_, serverId) => {
      queryClient.invalidateQueries({ queryKey: ['publicServers'] });
      queryClient.invalidateQueries({ queryKey: ['userServers', user?.id] });
    },
  });

  return {
    publicServers: publicServers || [],
    userServers: userServers || [],
    isLoading: isLoadingPublic || isLoadingUser,
    createServer: createServerMutation.mutate,
    joinServer: joinServerMutation.mutate,
    leaveServer: leaveServerMutation.mutate,
    updateServer: updateServerMutation.mutate,
    deleteServer: deleteServerMutation.mutate,
    isCreating: createServerMutation.isPending,
    isJoining: joinServerMutation.isPending,
    isLeaving: leaveServerMutation.isPending,
    isUpdating: updateServerMutation.isPending,
    isDeleting: deleteServerMutation.isPending,
  };
};
