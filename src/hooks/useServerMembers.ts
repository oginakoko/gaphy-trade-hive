import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { ServerMember } from '@/types/server';
import { useAuth } from './useAuth';

const fetchServerMembers = async (serverId: string): Promise<ServerMember[]> => {
    const { data, error } = await supabase
        .from('server_members')
        .select('*, profiles(username, avatar_url)')
        .eq('server_id', serverId);

    if (error) throw new Error(error.message);
    return data as ServerMember[];
};

const removeServerMember = async ({ serverId, userId }: { serverId: string, userId: string }) => {
    const { data, error } = await supabase.functions.invoke('remove-server-member', {
        body: { serverId, userId },
    });
    if (error) throw error;
    return data;
};

const updateServerMemberRole = async ({ serverId, userId, role }: { serverId: string, userId: string, role: ServerMember['role'] }) => {
    const { data, error } = await supabase.functions.invoke('update-server-member-role', {
        body: { serverId, userId, role },
    });
    if (error) throw error;
    return data;
};

export const useServerMembers = (serverId: string) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: members, isLoading } = useQuery({
        queryKey: ['serverMembers', serverId],
        queryFn: () => fetchServerMembers(serverId),
        enabled: !!serverId,
    });

    const removeMemberMutation = useMutation({
        mutationFn: removeServerMember,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['serverMembers', variables.serverId] });
            // Also invalidate server data to update member count
            queryClient.invalidateQueries({ queryKey: ['publicServers'] });
            queryClient.invalidateQueries({ queryKey: ['userServers', user?.id] });
        },
    });

    const updateMemberRoleMutation = useMutation({
        mutationFn: updateServerMemberRole,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['serverMembers', variables.serverId] });
        },
    });

    return {
        members: members || [],
        isLoading,
        removeMember: removeMemberMutation.mutate,
        isRemovingMember: removeMemberMutation.isPending,
        updateMemberRole: updateMemberRoleMutation.mutate,
        isUpdatingMemberRole: updateMemberRoleMutation.isPending,
    };
};
