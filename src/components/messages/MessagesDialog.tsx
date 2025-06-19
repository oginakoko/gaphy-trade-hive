import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useFollows';
import { Loader2, MessageCircle, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useMediaQuery } from 'react-responsive';

export function MessagesDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { conversations = [], sendMessage, markAsRead, loading } = useMessages();
  const { checkMutualFollow } = useFollows();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const filteredConversations = conversations ?? [];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !messageText.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage({
        recipient_id: selectedChat,
        content: messageText,
      });
      setMessageText('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };
  useEffect(() => {
    if (selectedChat) {
      markAsRead(selectedChat).catch((error) => {
        console.error('Failed to mark messages as read:', error);
      });
    }
  }, [selectedChat, markAsRead]);

  const selectedConversation = selectedChat 
    ? filteredConversations.find(conv => conv.other_user_id === selectedChat)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        onClick={() => setIsOpen(true)}
        className="relative bg-transparent hover:bg-gray-800"
        style={{ color: '#00FFB0', opacity: 1, filter: 'drop-shadow(0 0 2px #00FFB0)' }}
        aria-label="Open messages"
      >
        <MessageCircle className="h-5 w-5" />
        {conversations.some(conv => conv.unread_count > 0) && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand-green" />
        )}
      </Button>
      <DialogContent aria-describedby="messages-dialog-desc" className={`bg-gray-900 border-gray-700 ${isMobile ? 'w-full h-full max-w-full p-0 rounded-none' : 'max-w-md sm:max-w-xl'} `}>
        <DialogHeader>
          <DialogTitle id="messages-dialog-title" className="text-white">Messages</DialogTitle>
          <DialogDescription id="messages-dialog-desc" className="text-gray-400">
            Chat with any user in the platform
          </DialogDescription>
        </DialogHeader>
        <div className={`flex ${isMobile ? 'flex-col h-[100dvh]' : 'h-[500px]'}`}> 
          {/* Conversations List */}
          <div className={`${isMobile ? (selectedChat ? 'hidden' : 'block') : 'w-1/3 border-r border-gray-700 pr-4'} ${isMobile ? 'w-full border-none pr-0' : ''}`}>
            <div className="flex justify-between items-center mb-4 px-2 pt-2">
              <h3 className="text-sm font-medium text-white">Messages</h3>
              <Button
                onClick={() => setIsNewMessageOpen(true)}
                className="bg-gray-800 hover:bg-gray-700 text-white"
              >
                New Message
              </Button>
            </div>
            <ScrollArea className={`${isMobile ? 'h-[calc(100dvh-120px)]' : 'h-[460px]'}`}> 
              <div className="space-y-2">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.other_user_id}
                      onClick={() => setSelectedChat(conv.other_user_id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                        "hover:bg-gray-800/60",
                        selectedChat === conv.other_user_id 
                          ? "bg-gray-800 shadow-lg shadow-brand-green/5 border border-brand-green/20" 
                          : "border border-transparent"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.other_user_avatar} />
                          <AvatarFallback>
                            {conv.other_user_name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 bg-brand-green text-black text-xs font-bold rounded-full flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white truncate">
                            {conv.other_user_name}
                          </p>
                          {conv.last_message && (
                            <span className="text-xs text-gray-400">
                              {new Date(conv.last_message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-sm text-gray-400 truncate">
                            {conv.last_message.content}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
            </ScrollArea>
          </div>

          {/* Chat Window */}
          <div className={`flex-1 pl-4 flex flex-col ${isMobile ? (selectedChat ? 'block w-full h-full' : 'hidden') : ''}`}>
            {selectedChat ? (
              <>
                <div className="flex items-center gap-2 mb-4 px-2 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`md:hidden mr-2`}
                    onClick={() => setSelectedChat(null)}
                  >
                    <ChevronDown className="h-5 w-5 rotate-90" />
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedConversation.other_user_avatar} />
                    <AvatarFallback>
                      {selectedConversation.other_user_name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium">{selectedConversation.other_user_name}</h3>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-4 p-4">
                    {selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.sender_id === user?.id ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            message.sender_id === user?.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-[10px] opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="mt-4 px-2 pb-2">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-800 border-gray-600 text-white"
                    />
                    <Button 
                      type="submit"
                      disabled={!messageText.trim() || sending}
                      className="bg-brand-green hover:bg-brand-green/90 text-black font-medium"
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
