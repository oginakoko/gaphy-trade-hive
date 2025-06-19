
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

export default function Messages() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { conversations = [], sendMessage, markAsRead, loading } = useMessages();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showUserDiscovery, setShowUserDiscovery] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);

  const isAdmin = profile?.is_admin;

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
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-12 gap-4 min-h-[calc(100vh-8rem)]">
        {/* Conversations List */}
        <div className="col-span-12 md:col-span-4 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Messages</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserDiscovery(true)}
              >
                <Users className="h-4 w-4 mr-1" />
                Discover
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBroadcast(true)}
                >
                  <Megaphone className="h-4 w-4 mr-1" />
                  Broadcast
                </Button>
              )}
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-12rem)]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No messages yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowUserDiscovery(true)}
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Start a conversation
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <Card
                    key={conv.other_user_id}
                    className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                      selectedChat === conv.other_user_id ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => setSelectedChat(conv.other_user_id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conv.other_user_avatar} />
                        <AvatarFallback>
                          {conv.other_user_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate">{conv.other_user_name}</h3>
                          {conv.unread_count > 0 && (
                            <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs min-w-[20px] text-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {conv.is_support_chat && (
                            <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                              Support
                            </span>
                          )}
                          {conv.last_message && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.last_message.content}
                            </p>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(conv.last_message.created_at).toLocaleString()}
                          </p>
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
        <div className="col-span-12 md:col-span-8 bg-gray-900/50 rounded-lg">
          {selectedChat ? (
            <div className="h-[calc(100vh-12rem)] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700">
                {(() => {
                  const conversation = conversations.find(conv => conv.other_user_id === selectedChat);
                  return conversation ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.other_user_avatar} />
                        <AvatarFallback>
                          {conversation.other_user_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-white">{conversation.other_user_name}</h3>
                        {conversation.is_support_chat && (
                          <p className="text-xs text-blue-400">Support Chat</p>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {conversations
                    .find(conv => conv.other_user_id === selectedChat)
                    ?.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                            {message.sender_id === user?.id && (
                              <span className="text-xs opacity-70">
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
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!messageText.trim()}>
                    Send
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <MessageSquarePlus className="h-16 w-16 opacity-50" />
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Welcome to Messages</h3>
                <p className="text-sm mb-4">Select a conversation to start messaging</p>
                <Button onClick={() => setShowUserDiscovery(true)}>
                  <Users className="h-4 w-4 mr-2" />
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
  );
}
