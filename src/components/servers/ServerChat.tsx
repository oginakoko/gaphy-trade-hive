import { useState, useEffect, useMemo } from 'react';
import { useServerMessages } from '@/hooks/useServerMessages';
import { Server, ServerMessage } from '@/types/server';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '../ui/use-toast';
import { X } from 'lucide-react';

import ServerChatHeader from './ServerChatHeader';
import ServerMessageList from './ServerMessageList';
import ServerMessageInput from './ServerMessageInput';
import EditServerDialog from './EditServerDialog';
import DeleteServerDialog from './DeleteServerDialog';
import ManageMembersDialog from './ManageMembersDialog';
import { useServers } from '@/hooks/useServers';
import { useServerMembers } from '@/hooks/useServerMembers';

interface ServerChatProps {
  server: Server;
  onBack: () => void;
}

const ServerChat = ({ server: initialServer, onBack }: ServerChatProps) => {
  const { user } = useAuth();
  const { messages, sendMessage, isSending, deleteMessage } = useServerMessages(initialServer.id);
  const { userServers, leaveServer } = useServers();
  const { members } = useServerMembers(initialServer.id);
  
  const [server, setServer] = useState(initialServer);
  const [replyingTo, setReplyingTo] = useState<ServerMessage | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);

  useEffect(() => {
    const updatedServer = userServers.find(s => s.id === initialServer.id);
    if (updatedServer) {
      setServer(updatedServer);
    }
  }, [userServers, initialServer.id]);

  const mentionableMembers = useMemo(() => {
    return members.map(member => ({
        id: member.user_id,
        username: member.profiles?.username ?? null,
        avatar_url: member.profiles?.avatar_url ?? null,
    })).filter(member => member.username);
  }, [members]);

  const handleSendMessage = async (message: string, mediaFile: File | null) => {
    if (!message && !mediaFile) return;

    // 1. Extract mentioned usernames from the message (e.g., @username)
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentionedUsernames = Array.from(message.matchAll(mentionRegex)).map(match => match[1]);
    // 2. Map usernames to UUIDs using members list
    const mentionedUserIds = mentionedUsernames
      .map(username => mentionableMembers.find(m => m.username === username)?.id)
      .filter(Boolean);

    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | 'audio' | 'document' | undefined;

    if (mediaFile && user) {
      try {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${server.id}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('server-media')
          .upload(filePath, mediaFile, {
            contentType: mediaFile.type,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('server-media')
          .getPublicUrl(uploadData.path);

        mediaUrl = urlData.publicUrl;
        mediaType = mediaFile.type.startsWith('image/') ? 'image' : 
                    mediaFile.type.startsWith('video/') ? 'video' :
                    mediaFile.type.startsWith('audio/') ? 'audio' : 'document';
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Could not upload the file.",
          variant: "destructive",
        })
        return;
      }
    }

    // Only send fields that exist in server_messages
    sendMessage({
      server_id: server.id,
      content: message,
      media_url: mediaUrl,
      media_type: mediaType,
      // mentioned_user_ids is NOT sent to the DB, only to the backend for notification logic
    }, {
      onSuccess: () => {
        setReplyingTo(null);
      },
      onError: (error: any) => {
        toast({
          title: "Error sending message",
          description: error.message || "An unknown error occurred.",
          variant: "destructive",
        });
      },
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId, {
      onSuccess: () => {
        toast({
          title: 'Message Deleted',
          description: 'Your message has been deleted.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete message.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleLeaveServer = () => {
    leaveServer({ serverId: server.id }, {
      onSuccess: () => {
        toast({ title: 'Success', description: `You have left ${server.name}.` });
        onBack();
      },
      onError: (error: any) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <ServerChatHeader
        server={server}
        onBack={onBack}
        onEdit={() => setIsEditOpen(true)}
        onDelete={() => setIsDeleteOpen(true)}
        onManageMembers={() => setIsManageMembersOpen(true)}
        onLeave={handleLeaveServer}
      />

      <ServerMessageList 
        messages={messages} 
        onDeleteMessage={handleDeleteMessage} 
        serverOwnerId={server.owner_id}
        onReply={setReplyingTo}
        serverId={server.id}  // Add the serverId prop
      />

      {replyingTo && (
        <div className="p-2 px-4 border-t border-gray-700 bg-gray-800 text-sm text-gray-300 flex justify-between items-center">
          <div>
            Replying to <span className="font-semibold text-white">{replyingTo.profiles?.username || 'Anonymous'}</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-700 rounded-full">
            <X size={16} />
          </button>
        </div>
      )}

      <ServerMessageInput onSendMessage={handleSendMessage} isSending={isSending} members={mentionableMembers} />

      <EditServerDialog
        server={server}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      <DeleteServerDialog
        serverId={server.id}
        serverName={server.name}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={onBack}
      />

      <ManageMembersDialog
        server={server}
        isOpen={isManageMembersOpen}
        onClose={() => setIsManageMembersOpen(false)}
      />
    </div>
  );
};

export default ServerChat;
