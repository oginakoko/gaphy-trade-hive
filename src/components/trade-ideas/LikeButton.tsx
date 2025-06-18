import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

interface LikeButtonProps {
  tradeIdeaId: string;
  initialLikesCount: number;
  initialIsLiked: boolean;
}

const LikeButton = ({ tradeIdeaId, initialLikesCount, initialIsLiked }: LikeButtonProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [optimisticLiked, setOptimisticLiked] = useState(initialIsLiked);
  const [optimisticCount, setOptimisticCount] = useState(initialLikesCount);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isUpdating) {
      setOptimisticLiked(initialIsLiked);
      setOptimisticCount(initialLikesCount);
    }
  }, [initialIsLiked, initialLikesCount, isUpdating]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You must be logged in to like an idea.');
      setIsUpdating(true);

      const { error } = await supabase.from('likes').insert({
        trade_idea_id: Number(tradeIdeaId),
        user_id: user.id,
      });

      if (error) {
        if (error.code === '23505') {
          // If duplicate like, query to confirm current state
          const { data } = await supabase
            .from('likes')
            .select('trade_idea_id')
            .eq('trade_idea_id', Number(tradeIdeaId))
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (data) {
            setOptimisticLiked(true);
            return;
          }
        }
        throw error;
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['userLikes'] });
      setOptimisticLiked(true);
      setOptimisticCount((prev) => prev + 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeIdeas'] });
      queryClient.invalidateQueries({ queryKey: ['tradeIdea', tradeIdeaId] });
      queryClient.invalidateQueries({ queryKey: ['userLikes', user?.id] });
    },
    onError: (error: Error) => {
      setOptimisticLiked(false);
      setOptimisticCount((prev) => prev - 1);
      toast({ title: 'Error liking idea', description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You must be logged in to unlike an idea.');
      setIsUpdating(true);

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('trade_idea_id', Number(tradeIdeaId))
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['userLikes'] });
      setOptimisticLiked(false);
      setOptimisticCount((prev) => prev - 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeIdeas'] });
      queryClient.invalidateQueries({ queryKey: ['tradeIdea', tradeIdeaId] });
      queryClient.invalidateQueries({ queryKey: ['userLikes', user?.id] });
    },
    onError: (error: Error) => {
      setOptimisticLiked(true);
      setOptimisticCount((prev) => prev + 1);
      toast({ title: 'Error unliking idea', description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  const handleLikeToggle = () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to like trade ideas.',
        action: <Button asChild><Link to="/auth">Sign In</Link></Button>,
      });
      return;
    }

    if (isUpdating) return; // Prevent double-clicks
    if (optimisticLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  return (
    <Button
      onClick={handleLikeToggle}
      variant="ghost"
      size="sm"
      className={`flex items-center gap-1 text-xs ${
        optimisticLiked ? 'text-brand-green' : 'text-gray-400'
      } hover:text-brand-green`}
      disabled={isUpdating}
    >
      <ThumbsUp size={14} className={optimisticLiked ? 'fill-brand-green' : ''} />
      <span>{optimisticCount}</span>
    </Button>
  );
};

export default LikeButton;
