
import { Comment } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface CommentCardProps {
  comment: Comment;
}

const CommentCard = ({ comment }: CommentCardProps) => {
  const authorName = comment.profiles?.username || 'Anonymous';
  const authorAvatar = comment.profiles?.avatar_url || '/placeholder.svg';

  return (
    <div className="flex gap-4 py-4 border-b border-white/10 last:border-b-0">
      <img src={authorAvatar} alt={authorName} className="h-10 w-10 rounded-full bg-brand-gray-200 object-cover" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-bold text-white">{authorName}</p>
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </p>
        </div>
        <p className="text-gray-300 break-words">{comment.content}</p>
      </div>
    </div>
  );
};

export default CommentCard;
