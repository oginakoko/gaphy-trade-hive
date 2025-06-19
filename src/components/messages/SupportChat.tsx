
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function SupportChat() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { conversations = [], sendMessage, markAsRead, loading } = useMessages();
  const [messageText, setMessageText] = useState('');

  const isAdmin = profile?.is_admin || false;

  // Find admin conversations
  const adminConversations = conversations.filter(conv => 
    conv.other_user?.is_admin || isAdmin
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    let recipientId: string;
    if (isAdmin) {
      // If admin is sending, use the currently selected user
      if (!selectedUserId) return;
      recipientId = selectedUserId;
    } else {
      // If normal user is sending, find first admin
      const adminConv = adminConversations[0];
      if (!adminConv) return;
      recipientId = adminConv.other_user_id;
    }

    await sendMessage({
      recipient_id: recipientId,
      content: messageText,
    });
    setMessageText('');
  };

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedConversation = selectedUserId 
    ? conversations.find(conv => conv.other_user_id === selectedUserId)
    : adminConversations[0];

  return (
    <div className="h-screen flex bg-background">
      {isAdmin && (
        <div className="w-64 border-r border-gray-700 bg-gray-900/50">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold text-white">Support Chats</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-65px)]">
            <div className="space-y-2 p-4">
              {conversations.map((conv) => (
                <button
                  key={conv.other_user_id}
                  onClick={() => {
                    setSelectedUserId(conv.other_user_id);
                    markAsRead(conv.other_user_id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-left transition-colors",
                    selectedUserId === conv.other_user_id && "bg-gray-800 border border-brand-green/30"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.other_user_avatar} />
                    <AvatarFallback className="bg-gray-700 text-white">
                      {conv.other_user_name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">
                      {conv.other_user_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {conv.last_message?.content || 'No messages yet'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="bg-brand-green text-black text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full bg-gray-900/30">
        <div className="p-4 border-b border-gray-700 bg-gray-900/50">
          <h2 className="font-semibold text-white text-lg">
            {isAdmin ? (selectedConversation ? 
              `Chat with ${selectedConversation.other_user_name}` : 
              'Select a user to chat with'
            ) : 'Support Chat'}
          </h2>
          {!isAdmin && (
            <p className="text-sm text-gray-400 mt-1">Get help from our support team</p>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
            </div>
          ) : !selectedConversation?.messages.length ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-center">
              <div>
                <div className="text-6xl mb-4">💬</div>
                {isAdmin ? 
                  'Select a user to start chatting' : 
                  'Start a conversation with support'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 max-w-[80%]",
                    message.sender_id === user?.id ? "ml-auto flex-row-reverse" : "mr-auto"
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
                      "rounded-lg p-3 shadow-sm",
                      message.sender_id === user?.id
                        ? "bg-brand-green text-black font-medium"
                        : "bg-gray-800 text-white border border-gray-700"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-1 opacity-70",
                      message.sender_id === user?.id ? "text-black/70" : "text-gray-400"
                    )}>
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-gray-900/50">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={isAdmin ? 
                  (selectedUserId ? "Type your message..." : "Select a user to chat with") :
                  "Type your message to support..."
                }
                disabled={isAdmin && !selectedUserId}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-brand-green focus:ring-brand-green min-h-[44px]"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isAdmin && !selectedUserId || !messageText.trim()}
              className="bg-brand-green hover:bg-brand-green/80 text-black font-medium px-6 h-[44px]"
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
