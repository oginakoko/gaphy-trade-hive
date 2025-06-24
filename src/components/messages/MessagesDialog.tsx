import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useFollows';
import { Loader2, MessageCircle, ChevronDown, Bell, Plus, Send, X, ArrowLeft } from 'lucide-react';
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

  const handleCloseDialog = () => {
    setIsOpen(false);
    setSelectedChat(null);
    setMessageText('');
  };

  const handleBackToConversations = () => {
    setSelectedChat(null);
    setMessageText('');
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
        className="relative bg-transparent hover:bg-gray-800/50 transition-all duration-200"
        style={{ color: '#00FFB0', opacity: 1, filter: 'drop-shadow(0 0 3px #00FFB0)' }}
        aria-label="Open messages"
      >
        <MessageCircle className="h-5 w-5" />
        {conversations.some(conv => conv.unread_count > 0) && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand-green animate-pulse" />
        )}
      </Button>
      
      <DialogContent 
        aria-labelledby="messages-dialog-title" 
        aria-describedby="messages-dialog-desc" 
        className={`
          bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 
          border border-gray-700/50 
          shadow-2xl shadow-black/50
          backdrop-blur-sm
          ${isMobile 
            ? 'w-full h-[100dvh] max-w-full p-0 rounded-none flex flex-col' 
            : 'max-w-7xl w-full h-[700px] flex flex-row p-0'
          }
        `}
      >
        {/* Header */}
        <DialogHeader className={`
          ${isMobile ? 'px-6 pt-6 pb-4' : 'absolute top-0 left-0 right-0 z-10 px-6 py-4'} 
          border-b border-gray-700/50 
          bg-gray-900/80 backdrop-blur-sm
          ${!isMobile ? 'rounded-t-lg' : ''}
        `}>
          <DialogTitle id="messages-dialog-title" className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-brand-green" />
            Messages
          </DialogTitle>
          <DialogDescription id="messages-dialog-desc" className="text-gray-400 text-sm">
            Connect and chat with users across the platform
          </DialogDescription>
        </DialogHeader>

        <div className={`
          flex flex-1 
          ${isMobile ? 'flex-col h-[100dvh]' : 'h-full pt-20'}
        `}>
          {/* Conversations Sidebar */}
          <div className={`
            ${isMobile ? (selectedChat ? 'hidden' : 'block') : 'w-80 border-r border-gray-700/50'} 
            flex flex-col 
            bg-gray-900/50
          `}>
            {/* New Message Button */}
            <div className="p-4 border-b border-gray-700/30">
              <Button
                onClick={() => setIsNewMessageOpen(true)}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-black font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Message
              </Button>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 px-4 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs mt-1">Start a new message to begin chatting</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.other_user_id}
                      onClick={() => setSelectedChat(conv.other_user_id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                        "hover:bg-gray-800/60 hover:shadow-md group",
                        selectedChat === conv.other_user_id
                          ? "bg-gradient-to-r from-brand-green/10 to-brand-green/5 border border-brand-green/30 shadow-lg shadow-brand-green/10"
                          : "border border-transparent hover:border-gray-700/50"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12 ring-2 ring-gray-700/50 group-hover:ring-brand-green/30 transition-all duration-200">
                          <AvatarImage src={conv.other_user_avatar} />
                          <AvatarFallback className="bg-gray-700 text-gray-300 font-medium">
                            {conv.other_user_name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 bg-brand-green text-black text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-white truncate text-sm mb-1">
                          {conv.other_user_name}
                        </p>
                        {conv.last_message && (
                          <p className="text-xs text-gray-400 truncate leading-relaxed">
                            {conv.last_message.content}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {conv.last_message && new Date(conv.last_message.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Window */}
          <div className={`
            flex-1 flex flex-col 
            ${isMobile ? (selectedChat ? 'block w-full h-full' : 'hidden') : ''} 
            ${!isMobile && !selectedChat ? 'hidden' : ''}
            bg-gray-900/30
          `}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-4 p-4 border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-gray-400 hover:text-white hover:bg-gray-800/50"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ChevronDown className="h-5 w-5 rotate-90" />
                  </Button>
                  <Avatar className="h-10 w-10 ring-2 ring-brand-green/30">
                    <AvatarImage src={selectedConversation?.other_user_avatar} />
                    <AvatarFallback className="bg-gray-700 text-gray-300 font-medium">
                      {selectedConversation?.other_user_name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate text-lg">
                      {selectedConversation?.other_user_name}
                    </h3>
                    <p className="text-xs text-gray-400">Active now</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 bg-gradient-to-b from-gray-900/20 to-gray-800/20">
                  <div className="space-y-4 p-4">
                    {selectedConversation?.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex items-end gap-2",
                          message.sender_id === user?.id && !message.is_broadcast ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.sender_id !== user?.id && !message.is_broadcast && (
                          <Avatar className="h-6 w-6 mb-1">
                            <AvatarImage src={selectedConversation.other_user_avatar} />
                            <AvatarFallback className="text-xs">
                              {selectedConversation.other_user_name[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            `${isMobile ? 'max-w-[80%]' : 'max-w-[70%]'} rounded-2xl px-4 py-3 shadow-lg`,
                            message.is_broadcast
                              ? "bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 text-yellow-100"
                              : message.sender_id === user?.id
                                ? "bg-gradient-to-r from-brand-green to-brand-green/90 text-black font-medium"
                                : "bg-gradient-to-r from-gray-700 to-gray-600 text-white"
                          )}
                        >
                          {message.is_broadcast && (
                            <div className="flex items-center gap-2 mb-2 text-yellow-300">
                              <Bell className="h-4 w-4" />
                              <span className="font-semibold text-sm">Admin Broadcast</span>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2 text-right">
                            {message.is_broadcast ? 'Sent to all users • ' : ''}
                            {new Date(message.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green/50 transition-all duration-200"
                        disabled={sending}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                    </div>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sending}
                      className="bg-brand-green hover:bg-brand-green/90 text-black font-medium px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {sending ? 'Sending...' : 'Send'}
                      </span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 bg-gradient-to-br from-gray-900/30 to-gray-800/30">
                <div className="text-center px-4">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Select a conversation</h3>
                  <p className="text-sm text-gray-500">Choose a conversation from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}