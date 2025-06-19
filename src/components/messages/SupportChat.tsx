
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

  const isAdmin = profile?.is_admin;

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
        <div className="w-64 border-r">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Support Chats</h2>
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
                    "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent text-left",
                    selectedUserId === conv.other_user_id && "bg-accent"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={conv.other_user_avatar} />
                    <AvatarFallback>
                      {conv.other_user_name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conv.other_user_name}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
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

      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">
            {isAdmin ? (selectedConversation ? 
              `Chat with ${selectedConversation.other_user_name}` : 
              'Select a user to chat with'
            ) : 'Support Chat'}
          </h2>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !selectedConversation?.messages.length ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {isAdmin ? 
                'Select a user to start chatting' : 
                'Start a conversation with support'}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 max-w-[80%]",
                    message.sender_id === user?.id ? "ml-auto" : "mr-auto"
                  )}
                >
                  {message.sender_id !== user?.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender?.avatar_url} />
                      <AvatarFallback>
                        {message.sender?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "rounded-lg p-3",
                      message.sender_id === user?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={isAdmin ? 
                (selectedUserId ? "Type your message..." : "Select a user to chat with") :
                "Type your message to support..."
              }
              disabled={isAdmin && !selectedUserId}
            />
            <Button type="submit" disabled={isAdmin && !selectedUserId}>
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
