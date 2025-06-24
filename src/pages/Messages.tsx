import { useEffect, useState } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MessageSquarePlus, Users, Megaphone, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserDiscovery } from '@/components/messages/UserDiscovery';
import { BroadcastDialog } from '@/components/messages/BroadcastDialog';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBlockUser } from '@/hooks/useBlockUser';
import { DesktopAdminTools } from '@/components/messages/DesktopAdminTools'; // Import the new component
import { MobileNav } from '@/components/layout/MobileNav'; // Import MobileNav

export default function Messages() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const { conversations = [], sendMessage, markAsRead, loading } = useMessages();
  const { isBlockedByOther } = useBlockUser();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showUserDiscovery, setShowUserDiscovery] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [isRecipientBlocked, setIsRecipientBlocked] = useState(false);

  const isAdmin = profile?.is_admin || false;
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkBlockStatus = async () => {
      if (selectedChat) {
        markAsRead(selectedChat);
        const blocked = await isBlockedByOther(selectedChat);
        setIsRecipientBlocked(blocked);
      }
    };
    checkBlockStatus();
  }, [selectedChat, markAsRead, isBlockedByOther]);

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

  const handleShowUserManagement = () => {
    // Placeholder for future user management logic
    console.log("Show User Management (Desktop)");
  };

  const renderDesktopLayout = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-8rem)]">
          {/* Conversations List / Sidebar */}
          <div className="col-span-12 md:col-span-4 space-y-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Messages</h2>
                <p className="text-gray-400">Connect with other traders</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserDiscovery(true)}
                className="border-brand-green/30 text-brand-green hover:bg-brand-green/10"
              >
                <Users className="h-4 w-4 mr-1" />
                Discover
              </Button>
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
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <Card
                      key={conversation.other_user_id}
                      className={cn(
                        'p-4 cursor-pointer transition-colors border-gray-700 hover:bg-gray-800/50',
                        selectedChat === conversation.other_user_id && 'bg-brand-green/10 border-brand-green/30',
                        conversation.unread_count > 0 && 'bg-gray-800/30'
                      )}
                      onClick={() => setSelectedChat(conversation.other_user_id)}
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.other_user_avatar || ''} />
                          <AvatarFallback className="bg-gray-700 text-white">
                            {conversation.other_user_name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white truncate">
                              {conversation.other_user_name}
                            </p>
                            {conversation.unread_count > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-green/20 text-brand-green">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                          {conversation.last_message && (
                            <p className="text-sm text-gray-400">
                              {conversation.last_message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
            {isAdmin && (
              <DesktopAdminTools
                onShowBroadcast={() => setShowBroadcast(true)}
                onShowUserManagement={handleShowUserManagement}
              />
            )}
          </div>

          {/* Chat Area */}
          <div className="col-span-12 md:col-span-8">
            <Card className="h-full border-gray-700 bg-gray-900/50">
              {selectedChat && conversations.find(c => c.other_user_id === selectedChat) ? (
                <div className="flex flex-col h-full">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={conversations.find(c => c.other_user_id === selectedChat)?.other_user_avatar || ''}
                        />
                        <AvatarFallback className="bg-gray-700 text-white">
                          {conversations.find(c => c.other_user_id === selectedChat)?.other_user_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {conversations.find(c => c.other_user_id === selectedChat)?.other_user_name}
                        </h3>
                        {isRecipientBlocked && (
                          <p className="text-sm text-red-400">This user has blocked you.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {conversations
                        .find(c => c.other_user_id === selectedChat)
                        ?.messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              'flex',
                              message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                            )}
                          >
                            <div
                              className={cn(
                                'max-w-[70%] rounded-lg px-4 py-2 break-words',
                                message.sender_id === user?.id
                                  ? 'bg-brand-green/20 text-white'
                                  : 'bg-gray-800 text-white'
                              )}
                            >
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                    <div className="flex space-x-2">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                      />
                      <Button
                        type="submit"
                        disabled={!messageText.trim() || isRecipientBlocked}
                        className="bg-brand-green hover:bg-brand-green/90"
                      >
                        {isRecipientBlocked ? 'Blocked' : 'Send'}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="text-6xl mb-4">💭</div>
                  <h3 className="text-2xl font-semibold text-white mb-2">Welcome to Messages</h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    Start a conversation with other traders to discuss strategies, share insights, or get support.
                  </p>
                  <Button
                    variant="outline"
                    className="border-brand-green/30 text-brand-green hover:bg-brand-green/10"
                    onClick={() => setShowUserDiscovery(true)}
                  >
                    <MessageSquarePlus className="h-5 w-5 mr-2" />
                    Start a conversation
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

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

  const renderMobileLayout = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Mobile Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Messages</h2>
        {/* Removed "New" button, as it will be handled by tab navigation or a dedicated screen */}
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 p-4 pb-20"> {/* Added padding-bottom for mobile nav */}
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
              onClick={() => setShowUserDiscovery(true)} // Keep UserDiscovery for starting new chats
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Start a conversation
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Card
                key={conversation.other_user_id}
                className={cn(
                  'p-4 cursor-pointer transition-colors border-gray-700 hover:bg-gray-800/50',
                  selectedChat === conversation.other_user_id && 'bg-brand-green/10 border-brand-green/30',
                  conversation.unread_count > 0 && 'bg-gray-800/30'
                )}
                onClick={() => setSelectedChat(conversation.other_user_id)}
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.other_user_avatar || ''} />
                    <AvatarFallback className="bg-gray-700 text-white">
                      {conversation.other_user_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate">
                        {conversation.other_user_name}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-green/20 text-brand-green">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-gray-400 truncate">
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Mobile Chat Area (conditionally rendered) */}
      {selectedChat && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col z-50">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)}>
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            <div className="flex items-center space-x-3 flex-1 ml-2">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={conversations.find(c => c.other_user_id === selectedChat)?.other_user_avatar || ''}
                />
                <AvatarFallback className="bg-gray-700 text-white text-sm">
                  {conversations.find(c => c.other_user_id === selectedChat)?.other_user_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {conversations.find(c => c.other_user_id === selectedChat)?.other_user_name}
                </h3>
                {isRecipientBlocked && (
                  <p className="text-xs text-red-400">This user has blocked you.</p>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {conversations
                .find(c => c.other_user_id === selectedChat)
                ?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85vw] rounded-lg px-4 py-2 break-words',
                        message.sender_id === user?.id
                          ? 'bg-brand-green/20 text-white'
                          : 'bg-gray-800 text-white'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-gray-900/50">
            <div className="flex space-x-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
              <Button
                type="submit"
                disabled={!messageText.trim() || isRecipientBlocked}
                className="bg-brand-green hover:bg-brand-green/90"
              >
                {isRecipientBlocked ? 'Blocked' : 'Send'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <UserDiscovery
        isOpen={showUserDiscovery}
        onClose={() => setShowUserDiscovery(false)}
        onStartChat={handleStartChat}
      />

      {/* Removed BroadcastDialog from mobile layout */}
      <MobileNav />
    </div>
  );

  return isMobile ? renderMobileLayout() : renderDesktopLayout();
}
