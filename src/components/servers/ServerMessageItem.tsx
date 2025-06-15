import React, { useState } from 'react';
import { ServerMessage } from '@/types/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { FileText, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ServerMessageItemProps {
  msg: ServerMessage;
  onDelete: (messageId: string) => void;
  serverOwnerId: string;
}

const ServerMessageItem = ({ msg, onDelete, serverOwnerId }: ServerMessageItemProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(msg.content || '');

  const isAuthor = user?.id === msg.user_id;
  const isServerOwner = user?.id === serverOwnerId;
  const canDelete = isAuthor || isServerOwner;
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

  const renderMessageContent = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
        if (index % 2 === 1) {
            return (
                <span key={index} className="text-brand-green font-semibold bg-brand-green/10 px-1 rounded mx-0.5">
                    @{part}
                </span>
            );
        }
        return part;
    });
};

  return (
    <div className="flex gap-3 group relative pr-12">
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
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{renderMessageContent(msg.content)}</p>
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
      {!isEditing && (canEdit || canDelete) && (
        <div
          className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-gray-800/50 rounded-md"
        >
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
