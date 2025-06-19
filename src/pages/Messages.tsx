
import { useEffect, useState } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MessageSquarePlus, Users, Megaphone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserDiscovery } from '@/components/messages/UserDiscovery';
import { BroadcastDialog } from '@/components/messages/BroadcastDialog';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

export default function Messages() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { conversations = [], sendMessage, markAsRead, loading } = useMessages();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showUserDiscovery, setShowUserDiscovery] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);

  const isAdmin = profile?.is_admin || false;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !messageText.trim()) return;

    await sendMessage({
      recipient_id: selectedChat,
      content: messageText,
    });
    setMessageText('');
  };

  const handleStartChat = (userId: string) => {
    setSelectedChat(userId);
    setShowUserDiscovery(false);
  };

  useEffect(() => {
    if (selectedChat) {
      markAsRead(selectedChat);
    }
  }, [selectedChat, markAsRead]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <div className="col-span-12 md:col-span-4 space-y-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Messages</h2>
                <p className="text-gray-400">Connect with other traders</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserDiscovery(true)}
                  className="border-brand-green/30 text-brand-green hover:bg-brand-green/10"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Discover
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBroadcast(true)}
                    className="border-brand-green/30 text-brand-green hover:bg-brand-green/10"
                  >
                    <Megaphone className="h-4 w-4 mr-1" />
                    Broadcast
                  </Button>
                )}
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-16rem)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-gray-400 mb-4">No conversations yet</p>
                  <Button 
                    variant="outline" 
                    className="border-brand-green/30 text-brand-green hover:bg-brand-green/10"
                    onClick={() => setShowUserDiscovery(true)}
                  >
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                    Start a conversation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <Card
                      key={conv.other_user_id}
                      className={cn(
                        "p-4 cursor-pointer transition-all duration-200 bg-gray-800/50 border-gray-700 hover:bg-gray-800/80 hover:border-brand-green/30",
                        selectedChat === conv.other_user_id && 'bg-gray-800 border-brand-green/50 shadow-lg shadow-brand-green/10'
                      )}
                      onClick={() => setSelectedChat(conv.other_user_id)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-gray-600">
                          <AvatarImage src={conv.other_user_avatar} />
                          <AvatarFallback className="bg-gray-700 text-white font-medium">
                            {conv.other_user_name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold truncate text-white">{conv.other_user_name}</h3>
                            {conv.unread_count > 0 && (
                              <span className="bg-brand-green text-black rounded-full px-2 py-1 text-xs font-bold min-w-[24px] text-center">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            {conv.is_support_chat && (
                              <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full font-medium">
                                Support
                              </span>
                            )}
                          </div>
                          {conv.last_message && (
                            <>
                              <p className="text-sm text-gray-300 truncate mb-1">
                                {conv.last_message.content}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(conv.last_message.created_at).toLocaleString()}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Window */}
          <div className="col-span-12 md:col-span-8 bg-gray-900/60 rounded-xl border border-gray-700 backdrop-blur-sm">
            {selectedChat ? (
              <div className="h-[calc(100vh-12rem)] flex flex-col">
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-700 bg-gray-900/50 rounded-t-xl">
                  {(() => {
                    const conversation = conversations.find(conv => conv.other_user_id === selectedChat);
                    return conversation ? (
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-gray-600">
                          <AvatarImage src={conversation.other_user_avatar} />
                          <AvatarFallback className="bg-gray-700 text-white font-medium">
                            {conversation.other_user_name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{conversation.other_user_name}</h3>
                          {conversation.is_support_chat && (
                            <p className="text-sm text-blue-400 font-medium">Support Chat</p>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    {conversations
                      .find(conv => conv.other_user_id === selectedChat)
                      ?.messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3",
                            message.sender_id === user?.id ? "justify-end" : "justify-start"
                          )}
                        >
                          {message.sender_id !== user?.id && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={message.sender?.avatar_url} />
                              <AvatarFallback className="bg-gray-700 text-white text-sm">
                                {message.sender?.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg p-4 shadow-sm",
                              message.sender_id === user?.id
                                ? "bg-brand-green text-black font-medium"
                                : "bg-gray-800 text-white border border-gray-700"
                            )}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className={cn(
                                "text-xs opacity-70",
                                message.sender_id === user?.id ? "text-black/70" : "text-gray-400"
                              )}>
                                {new Date(message.created_at).toLocaleTimeString()}
                              </span>
                              {message.sender_id === user?.id && (
                                <span className="text-xs opacity-70 text-black/70">
                                  {message.is_read ? '✓✓' : '✓'}
                                </span>
                              )}
                          </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-700 bg-gray-900/50 rounded-b-xl">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-brand-green focus:ring-brand-green min-h-[48px] text-base"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={!messageText.trim()}
                      className="bg-brand-green hover:bg-brand-green/80 text-black font-medium px-8 h-[48px]"
                    >
                      Send
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="text-8xl mb-6">💬</div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-white mb-2">Welcome to Messages</h3>
                  <p className="text-gray-400 text-lg mb-6">Connect with traders and get support</p>
                  <Button 
                    onClick={() => setShowUserDiscovery(true)}
                    className="bg-brand-green hover:bg-brand-green/80 text-black font-medium px-6 py-3"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Discover Users
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <UserDiscovery
          isOpen={showUserDiscovery}
          onClose={() => setShowUserDiscovery(false)}
          onStartChat={handleStartChat}
        />
        
        {isAdmin && (
          <BroadcastDialog
            isOpen={showBroadcast}
            onClose={() => setShowBroadcast(false)}
          />
        )}
      </div>
    </div>
  );
}
