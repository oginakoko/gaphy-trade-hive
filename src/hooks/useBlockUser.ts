import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useBlockUser() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockedUsers = useCallback(async () => {
    if (!user) {
      setBlockedUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      if (error) throw error;

      setBlockedUsers(data.map(item => item.blocked_id));
    } catch (err) {
      console.error('Error fetching blocked users:', err);
      setError('Failed to fetch blocked users.');
      toast({
        title: 'Error',
        description: 'Failed to load blocked users.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const blockUser = async (userIdToBlock: string) => {
    if (!user) {
      toast({
        description: 'You must be logged in to block users.',
        variant: 'destructive',
      });
      return;
    }

    if (userIdToBlock === user.id) {
      toast({
        description: 'You cannot block yourself.',
        variant: 'destructive',
      });
      return;
    }

    // Check if the user is an admin
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userIdToBlock)
      .single();

    if (profileError) {
      console.error('Error fetching profile for block check:', profileError);
      toast({
        title: 'Error',
        description: 'Failed to check user status.',
        variant: 'destructive',
      });
      return;
    }

    if (profileData?.is_admin) {
      toast({
        description: 'You cannot block an admin user.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_blocks')
        .insert({ blocker_id: user.id, blocked_id: userIdToBlock });

      if (error) throw error;

      setBlockedUsers(prev => [...prev, userIdToBlock]);
      toast({
        description: 'User blocked successfully.',
      });
    } catch (err) {
      console.error('Error blocking user:', err);
      setError('Failed to block user.');
      toast({
        title: 'Error',
        description: 'Failed to block user.',
        variant: 'destructive',
      });
    }
  };

  const unblockUser = async (userIdToUnblock: string) => {
    if (!user) {
      toast({
        description: 'You must be logged in to unblock users.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userIdToUnblock);

      if (error) throw error;

      setBlockedUsers(prev => prev.filter(id => id !== userIdToUnblock));
      toast({
        description: 'User unblocked successfully.',
      });
    } catch (err) {
      console.error('Error unblocking user:', err);
      setError('Failed to unblock user.');
      toast({
        title: 'Error',
        description: 'Failed to unblock user.',
        variant: 'destructive',
      });
    }
  };

  const isBlockedByMe = useCallback((userId: string) => {
    return blockedUsers.includes(userId);
  }, [blockedUsers]);

  const isBlockedByOther = useCallback(async (userId: string) => {
    if (!user) return false;
    const { data, error } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', userId)
      .eq('blocked_id', user.id)
      .single();
    return !error && data !== null;
  }, [user]);

  return {
    blockedUsers,
    loading,
    error,
    blockUser,
    unblockUser,
    isBlockedByMe,
    isBlockedByOther,
    fetchBlockedUsers
  };
}