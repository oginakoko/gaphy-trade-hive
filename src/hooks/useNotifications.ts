
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Server } from '@/types/server';
import { Profile } from '@/types';

export interface Notification {
    id: string;
    created_at: string;
    recipient_id: string;
    sender_id: string;
    type: 'mention' | string;
    reference_id: string;
    server_id: string;
    is_read: boolean;
    sender: Pick<Profile, 'username' | 'avatar_url'>;
    server: Pick<Server, 'name'>;
}

export const useNotifications = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const fetchNotifications = async (userId: string) => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*, sender:profiles!sender_id(username, avatar_url), server:servers(name)')
            .eq('recipient_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        return data as Notification[];
    };

    const { data: notifications, isLoading, error } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: () => fetchNotifications(user!.id),
        enabled: !!user,
        refetchInterval: 60000, // Refetch every minute
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (notificationIds: string[]) => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', notificationIds);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        }
    });

    return {
        notifications: notifications || [],
        unreadCount: notifications?.filter(n => !n.is_read).length || 0,
        isLoading,
        error,
        markAsRead: markAsReadMutation.mutate,
    };
};
