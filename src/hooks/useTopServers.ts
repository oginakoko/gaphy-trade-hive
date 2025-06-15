
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Server } from '@/types/server';

export interface TopServer extends Server {
    message_count: number;
    score: number;
}

const fetchTopServers = async (): Promise<TopServer[]> => {
    const { data, error } = await supabase
        .from('servers')
        .select('*, profiles!owner_id(username, avatar_url), server_members(count), server_messages(count)')
        .eq('is_public', true);

    if (error) throw new Error(error.message);

    const serversWithStats = (data as any[]).map(s => {
        const { server_members, server_messages, ...rest } = s;
        const member_count = server_members[0]?.count ?? 0;
        const message_count = server_messages[0]?.count ?? 0;
        return {
            ...rest,
            member_count,
            message_count,
            score: member_count + message_count,
        };
    });

    serversWithStats.sort((a, b) => b.score - a.score);

    return serversWithStats as TopServer[];
};

export const useTopServers = () => {
    return useQuery<TopServer[], Error>({
        queryKey: ['topServers'],
        queryFn: fetchTopServers,
    });
};
