
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

  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);

  useEffect(() => {
    setLikesCount(initialLikesCount);
    setIsLiked(initialIsLiked);
  }, [initialLikesCount, initialIsLiked]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You must be logged in to like an idea.');

      const { error } = await supabase.from('likes').insert({
        trade_idea_id: Number(tradeIdeaId),
        user_id: user.id,
      });

      if (error) {
        // This handles cases where the user might click quickly multiple times
        // or if there's a race condition. It safely ignores duplicate like errors.
        if (error.code === '23505') return;
        throw error;
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['userLikes'] });
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeIdeas'] });
      queryClient.invalidateQueries({ queryKey: ['tradeIdea', tradeIdeaId] });
      queryClient.invalidateQueries({ queryKey: ['userLikes', user?.id] });
    },
    onError: (error: Error) => {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
      toast({ title: 'Error liking idea', description: error.message, variant: 'destructive' });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You must be logged in to unlike an idea.');

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('trade_idea_id', Number(tradeIdeaId))
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['userLikes'] });
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeIdeas'] });
      queryClient.invalidateQueries({ queryKey: ['tradeIdea', tradeIdeaId] });
      queryClient.invalidateQueries({ queryKey: ['userLikes', user?.id] });
    },
    onError: (error: Error) => {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      toast({ title: 'Error unliking idea', description: error.message, variant: 'destructive' });
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

    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const isPending = likeMutation.isPending || unlikeMutation.isPending;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLikeToggle}
      disabled={isPending}
      className="flex items-center gap-2 text-gray-400 hover:text-brand-green data-[liked=true]:text-brand-green"
      data-liked={isLiked}
    >
      <ThumbsUp size={16} className={isLiked ? 'fill-current' : ''} />
      <span>{likesCount}</span>
    </Button>
  );
};

export default LikeButton;
