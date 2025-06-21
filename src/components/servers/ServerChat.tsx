import { useState, useEffect, useMemo } from 'react';
import { useServerMessages } from '@/hooks/useServerMessages';
import { Server, ServerMessage } from '@/types/server';
import { useAuth } from '@/hooks/useAuth';
import { chatWithAI, decodeAIStreamToString } from '@/lib/openrouter';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/hooks/useProfile';
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
  const { data: profile } = useProfile();
  
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
    // Detect @gaphy mention
    if (message.trim().toLowerCase().startsWith('@gaphy')) {
      // Remove @gaphy mention and trim
      const question = message.replace(/^@gaphy/i, '').trim();
      // Fetch admin profile (first admin user)
      const { data: admins } = await supabase.from('profiles').select('*').eq('is_admin', true).limit(1);
      const adminProfile = admins && admins.length > 0 ? admins[0] : null;
      // Build admin context (fetch all app data)
      let tradeIdeas = [];
      let servers = [];
      let users = [];
      let ads = [];
      let affiliateLinks = [];
      let contextObj: any = {};
      try {
        const [tradeIdeasRes, serversRes, usersRes, adsRes, affRes] = await Promise.all([
          supabase.from('trade_ideas').select('id, title, instrument, breakdown, image_url, tags, user_id, likes').order('created_at', { ascending: false }).limit(50),
          supabase.from('servers').select('id, name, description, image_url, owner_id, created_at, is_public, member_count').order('created_at', { ascending: false }).limit(50),
          supabase.from('profiles').select('id, username, avatar_url, is_admin, is_banned').limit(100),
          supabase.from('ads').select('id, title, content, link_url, media_url, media_type, status, start_date, end_date, cost').limit(50),
          supabase.from('affiliate_links').select('id, title, url').limit(50)
        ]);
        tradeIdeas = tradeIdeasRes.data || [];
        servers = serversRes.data || [];
        users = usersRes.data || [];
        ads = adsRes.data || [];
        affiliateLinks = affRes.data || [];
        contextObj = {
          tradeIdeas,
          servers,
          users,
          ads,
          affiliateLinks
        };
      } catch (err) {
        contextObj = { tradeIdeas: [] };
      }
      // Strict system prompt for server chat
      const systemPrompt = `You are AlphaFinder, the AI assistant for Gaphy Trade Hive.\n\nGREETINGS: If the user says hello or makes small talk, respond with exactly: "Hi there! How can I help with trading today?"\n\nDATA QUERIES: For questions about ads/trades/links, use this data (in JSON):\n${JSON.stringify(contextObj, null, 2)}\n\nRULES:\n1. Never mention data unless explicitly asked\n2. Answer in ONE natural sentence without lists\n3. Example responses:\n   - "There are 2 approved ads for 'mvuvi delights'"\n   - "The trading course is at gaphytradingcourse.vercel.app"\n4. If no data matches, say "No data found"`;
      // Send to AI
      const chatMessages: { role: "system" | "user"; content: string }[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ];
      let botResponse = '';
      try {
        const stream = await chatWithAI(chatMessages as any); // chatWithAI expects Message[]
        botResponse = await decodeAIStreamToString(stream);
      } catch (err) {
        botResponse = 'Sorry, I could not process your request.';
      }
      // Post bot response as a server message (as admin/bot)
      if (adminProfile) {
        // Use the direct sendMessage function, not the hook, to allow specifying user_id
        const { sendMessage } = await import('@/hooks/useServerMessages');
        await sendMessage({
          server_id: server.id,
          user_id: adminProfile.id, // Always post as admin
          content: botResponse,
          media_url: undefined,
          media_type: undefined
        });
        setReplyingTo(null);
      }
      return;
    }

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
