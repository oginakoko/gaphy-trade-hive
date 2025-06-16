import { Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Edit } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface CommentCardProps {
  comment: Comment;
  tradeIdeaId: string;
}

const CommentCard = ({ comment, tradeIdeaId }: CommentCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

  const isAuthor = user?.id === comment.user_id;
  const authorName = comment.profiles?.username || 'Anonymous';
  const authorAvatar = comment.profiles?.avatar_url || '/placeholder.svg';

  const updateCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', comment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Comment updated.' });
      queryClient.invalidateQueries({ queryKey: ['comments', tradeIdeaId] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleUpdate = () => {
    if (editedContent.trim() && editedContent !== comment.content) {
      updateCommentMutation.mutate(editedContent);
    } else {
      setIsEditing(false);
    }
  };


  return (
    <div className="flex gap-4 py-4 border-b border-white/10 last:border-b-0 group relative">
      <img 
        src={authorAvatar || '/images/avatars/default-avatar.png'} 
        alt={authorName}
        className="h-10 w-10 rounded-full bg-brand-gray-200 object-cover"
        onError={(e) => {
          e.currentTarget.src = '/images/avatars/default-avatar.png';
        }}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-bold text-white">{authorName}</p>
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </p>
        </div>
        {!isEditing ? (
          <p className="text-gray-300 break-words">{comment.content}</p>
        ) : (
          <div className="space-y-2 mt-2">
            <Textarea 
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="glass-input resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleUpdate} disabled={updateCommentMutation.isPending} className="bg-brand-green text-black hover:bg-brand-green/80">
                {updateCommentMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </div>
      {isAuthor && !isEditing && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsEditing(true)}>
            <Edit size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommentCard;
