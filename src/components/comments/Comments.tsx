
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Comment } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import CommentCard from './CommentCard';
import CommentForm from './CommentForm';

const fetchComments = async (tradeIdeaId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('trade_idea_id', tradeIdeaId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data as Comment[];
};

interface CommentsProps {
  tradeIdeaId: string;
}

const Comments = ({ tradeIdeaId }: CommentsProps) => {
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', tradeIdeaId],
    queryFn: () => fetchComments(tradeIdeaId),
  });

  return (
    <div className="glass-card rounded-xl mt-8">
      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Discussion ({comments?.length || 0})
        </h2>
        
        <div className="mt-6">
          {isLoading && (
            <>
              <Skeleton className="h-24 w-full mb-4" />
              <Skeleton className="h-24 w-full" />
            </>
          )}
          {error && <p className="text-red-500 text-center py-4">Error loading comments: {(error as Error).message}. Make sure you have run the SQL script.</p>}
          
          {comments && comments.length > 0 && (
            <div>
              {comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} tradeIdeaId={tradeIdeaId} />
              ))}
            </div>
          )}
          
          {comments && comments.length === 0 && !isLoading && !error && (
            <p className="text-gray-400 text-center py-8">Be the first to leave a comment.</p>
          )}
        </div>
        
        <CommentForm tradeIdeaId={tradeIdeaId} />

      </div>
    </div>
  );
};

export default Comments;
