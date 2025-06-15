
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Send, ArrowLeft, Paperclip, FileText } from 'lucide-react';
import { useServerMessages } from '@/hooks/useServerMessages';
import { Server } from '@/types/server';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '../ui/use-toast';

interface ServerChatProps {
  server: Server;
  onBack: () => void;
}

const ServerChat = ({ server, onBack }: ServerChatProps) => {
  const [message, setMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { messages, sendMessage, isSending } = useServerMessages(server.id);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !mediaFile) return;

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

        if (uploadError) {
          throw uploadError;
        }

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
      content: message.trim(),
      media_url: mediaUrl,
      media_type: mediaType,
    });

    setMessage('');
    setMediaFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-gray-700"
        >
          <ArrowLeft size={20} />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={server.image_url || undefined} />
          <AvatarFallback className="bg-brand-green text-black text-sm">
            {server.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-white font-semibold">{server.name}</h3>
          <p className="text-gray-400 text-sm">{server.member_count || 0} members</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1">
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
                      <img 
                        src={msg.media_url} 
                        alt="Shared content" 
                        className="max-w-xs rounded-lg"
                      />
                    )}
                    {msg.media_type === 'video' && (
                      <video 
                        src={msg.media_url} 
                        controls 
                        className="max-w-xs rounded-lg"
                      />
                    )}
                    {msg.media_type === 'audio' && (
                      <audio src={msg.media_url} controls className="w-full max-w-xs" />
                    )}
                    {msg.media_type === 'document' && (
                      <Card className="p-3 max-w-xs">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-300 truncate">
                            Document
                          </span>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700">
        {mediaFile && (
          <div className="mb-2 p-2 bg-gray-700 rounded flex items-center justify-between">
            <span className="text-sm text-gray-300">
              {mediaFile.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMediaFile(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </Button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-white"
          >
            <Paperclip size={20} />
          </Button>
          
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 border-gray-600 text-white"
          />
          
          <Button
            type="submit"
            disabled={isSending || (!message.trim() && !mediaFile)}
            className="bg-brand-green text-black hover:bg-brand-green/80"
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ServerChat;
