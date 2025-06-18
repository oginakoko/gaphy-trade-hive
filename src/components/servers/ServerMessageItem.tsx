
import React, { useState } from 'react';
import { ServerMessage } from '@/types/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { FileText, Trash2, Edit, MessageSquareReply } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useServerMembers } from '@/hooks/useServerMembers';
import MessageContent from './MessageContent';

interface ServerMessageItemProps {
  msg: ServerMessage;
  onDelete: (messageId: string) => void;
  serverOwnerId: string;
  onReply: (message: ServerMessage) => void;
  serverId: string;
}

const ServerMessageItem = ({ msg, onDelete, serverOwnerId, onReply, serverId }: ServerMessageItemProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(msg.content || '');
  const { members } = useServerMembers(serverId);

  const isAuthor = user?.id === msg.user_id;
  const isServerOwner = user?.id === serverOwnerId;
  
  // Get current user's member role
  const currentUserRole = members.find(m => m.user_id === user?.id)?.role;
  const messageAuthorRole = members.find(m => m.user_id === msg.user_id)?.role;
  
  // Can delete if:
  // 1. User is the message author
  // 2. User is the server owner
  // 3. User is a moderator AND message author is not a moderator or owner
  const canDelete = isAuthor || 
    isServerOwner || 
    (currentUserRole === 'moderator' && messageAuthorRole !== 'moderator' && messageAuthorRole !== 'owner');
  
  const canEdit = isAuthor && msg.content; // Can only edit messages with text content

  const updateMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('server_messages')
        .update({ content })
        .eq('id', msg.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Message updated.' });
      queryClient.invalidateQueries({ queryKey: ['serverMessages', msg.server_id] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setIsEditing(false);
    }
  });

  const handleUpdate = () => {
    if (editedContent.trim() && editedContent !== msg.content) {
        updateMessageMutation.mutate(editedContent);
    } else {
        setIsEditing(false);
    }
  };

  const handleQuotedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const targetId = msg.parent_message?.id;
    if (targetId) {
        const element = document.getElementById(`message-${targetId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element?.classList.add('highlight-message');
        setTimeout(() => element?.classList.remove('highlight-message'), 1500);
    }
  };

  return (
    <div className="flex gap-3 group relative pr-16" id={`message-${msg.id}`}>
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
        
        {msg.parent_message && (
          <a href={`#message-${msg.parent_message.id}`} onClick={handleQuotedClick} className="block cursor-pointer">
            <div className="relative pl-3 before:absolute before:left-0 before:top-1 before:h-[calc(100%-0.5rem)] before:w-1 before:bg-gray-600 before:rounded-full mb-1 opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-xs text-gray-300 font-medium flex items-center gap-1">
                    <MessageSquareReply size={12} />
                    {msg.parent_message.profiles?.username || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-400 truncate ml-2">
                    {msg.parent_message.content || '...'}
                </p>
            </div>
        </a>
        )}

        {isEditing ? (
           <div className="space-y-2 mt-2">
            <Textarea 
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="glass-input bg-gray-800 border-gray-700 resize-none"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleUpdate} disabled={updateMessageMutation.isPending} className="bg-brand-green text-black hover:bg-brand-green/80">
                {updateMessageMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {msg.content && (
              <MessageContent content={msg.content} />
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
          </>
        )}
      </div>
      {!isEditing && (
        <div
          className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-gray-800/50 rounded-md"
        >
          <button
              onClick={() => onReply(msg)}
              className="p-1 text-gray-400 hover:text-white"
              aria-label="Reply to message"
            >
              <MessageSquareReply size={14} />
            </button>
          {canEdit && (
            <button
              onClick={() => {
                setEditedContent(msg.content || '');
                setIsEditing(true);
              }}
              className="p-1 text-gray-400 hover:text-white"
              aria-label="Edit message"
            >
              <Edit size={14} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(msg.id)}
              className="p-1 text-gray-400 hover:text-red-500"
              aria-label="Delete message"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ServerMessageItem;
