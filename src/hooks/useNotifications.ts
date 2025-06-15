
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Server } from '@/types/server';
import { Profile } from '@/types';
import { toast } from '@/components/ui/use-toast';

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
    });

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
                async (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
                    
                    const newNotification = payload.new as { sender_id: string, server_id: string };
                    try {
                        const { data: sender } = await supabase.from('profiles').select('username').eq('id', newNotification.sender_id).single();
                        const { data: server } = await supabase.from('servers').select('name').eq('id', newNotification.server_id).single();

                        toast({
                            title: `New Mention in #${server?.name || 'server'}`,
                            description: `${sender?.username || 'Someone'} mentioned you.`,
                        });
                    } catch (error) {
                         toast({
                            title: "New Notification",
                            description: "You have a new mention.",
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);

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
