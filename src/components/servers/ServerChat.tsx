import { useState, useEffect } from 'react';
import { useServerMessages } from '@/hooks/useServerMessages';
import { Server } from '@/types/server';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '../ui/use-toast';

import ServerChatHeader from './ServerChatHeader';
import ServerMessageList from './ServerMessageList';
import ServerMessageInput from './ServerMessageInput';
import EditServerDialog from './EditServerDialog';
import DeleteServerDialog from './DeleteServerDialog';
import { useServers } from '@/hooks/useServers';

interface ServerChatProps {
  server: Server;
  onBack: () => void;
}

const ServerChat = ({ server: initialServer, onBack }: ServerChatProps) => {
  const { user } = useAuth();
  const { messages, sendMessage, isSending } = useServerMessages(initialServer.id);
  const { userServers } = useServers();
  
  // Keep local state for the server to reflect updates without a full page reload
  const [server, setServer] = useState(initialServer);

  useEffect(() => {
    const updatedServer = userServers.find(s => s.id === initialServer.id);
    if (updatedServer) {
      setServer(updatedServer);
    }
  }, [userServers, initialServer.id]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleSendMessage = async (message: string, mediaFile: File | null) => {
    if (!message && !mediaFile) return;

    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | 'audio' | 'document' | undefined;

    if (mediaFile && user) {
      try {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${server.id}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('server-media')
          .upload(filePath, mediaFile);

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

    sendMessage({
      server_id: server.id,
      content: message,
      media_url: mediaUrl,
      media_type: mediaType,
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      <ServerChatHeader
        server={server}
        onBack={onBack}
        onEdit={() => setIsEditOpen(true)}
        onDelete={() => setIsDeleteOpen(true)}
      />

      <ServerMessageList messages={messages} />

      <ServerMessageInput onSendMessage={handleSendMessage} isSending={isSending} />

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
    </div>
  );
};

export default ServerChat;
