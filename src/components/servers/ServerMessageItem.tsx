
import { ServerMessage } from '@/types/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { FileText, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ServerMessageItemProps {
  msg: ServerMessage;
  onDelete: (messageId: string) => void;
  serverOwnerId: string;
}

const ServerMessageItem = ({ msg, onDelete, serverOwnerId }: ServerMessageItemProps) => {
  const { user } = useAuth();
  const isAuthor = user?.id === msg.user_id;
  const isServerOwner = user?.id === serverOwnerId;
  const canDelete = isAuthor || isServerOwner;

  return (
    <div className="flex gap-3 group relative pr-8">
      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
        <AvatarImage src={msg.profiles?.avatar_url || undefined} />
        <AvatarFallback className="bg-gray-600 text-white text-sm">
          {msg.profiles?.username?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-medium text-sm">
            {msg.profiles?.username || 'Anonymous'}
          </span>
          <span className="text-gray-400 text-xs">
            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
          </span>
        </div>
        {msg.content && (
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{msg.content}</p>
        )}
        {msg.media_url && (
          <div className="mt-2">
            {msg.media_type === 'image' && (
              <a href={msg.media_url} target="_blank" rel="noopener noreferrer">
                <img src={msg.media_url} alt="Shared content" className="max-w-xs rounded-lg cursor-pointer" />
              </a>
            )}
            {msg.media_type === 'video' && (
              <video src={msg.media_url} controls className="max-w-xs rounded-lg" />
            )}
            {msg.media_type === 'audio' && (
              <audio src={msg.media_url} controls className="w-full max-w-xs" />
            )}
            {msg.media_type === 'document' && (
              <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="block max-w-xs">
                <Card className="p-3 bg-gray-700 border-gray-600 hover:bg-gray-600 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-gray-400" />
                    <span className="text-sm text-gray-300 truncate">
                      View Document
                    </span>
                  </div>
                </Card>
              </a>
            )}
          </div>
        )}
      </div>
      {canDelete && (
        <button
          onClick={() => onDelete(msg.id)}
          className="absolute top-1 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
          aria-label="Delete message"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

export default ServerMessageItem;
