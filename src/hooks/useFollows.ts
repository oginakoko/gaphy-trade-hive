import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export function useFollows() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollows = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch followers
      const { data: followersData, error: followersError } = await supabase
        .from('user_follows')
        .select('*')
        .eq('following_id', user.id);

      if (followersError) throw followersError;

      // Fetch following
      const { data: followingData, error: followingError } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      setFollowers(followersData);
      setFollowing(followingData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch follows',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const followUser = async (userId: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: userId });

      if (error) throw error;
      
      await fetchFollows();
      toast({
        description: 'User followed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to follow user',
        variant: 'destructive',
      });
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .match({ follower_id: user.id, following_id: userId });

      if (error) throw error;
      
      await fetchFollows();
      toast({
        description: 'User unfollowed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unfollow user',
        variant: 'destructive',
      });
    }
  };

  const checkMutualFollow = useCallback((userId: string) => {
    return followers.some(f => f.follower_id === userId) && 
           following.some(f => f.following_id === userId);
  }, [followers, following]);

  const isFollowing = useCallback((userId: string) => {
    return following.some(f => f.following_id === userId);
  }, [following]);

  const isFollowedBy = useCallback((userId: string) => {
    return followers.some(f => f.follower_id === userId);
  }, [followers]);

  useEffect(() => {
    fetchFollows();
  }, [fetchFollows]);

  return {
    followers,
    following,
    loading,
    followUser,
    unfollowUser,
    checkMutualFollow,
    isFollowing,
    isFollowedBy,
    refetch: fetchFollows,
  };
}
