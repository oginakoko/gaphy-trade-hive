import { useEffect, useState } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useFollows } from '@/hooks/useFollows';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NewMessageDialog } from '@/components/NewMessageDialog';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const { user } = useAuth();
  const { conversations = [], sendMessage, markAsRead, loading } = useMessages();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  const displayedConversations = conversations ?? [];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !messageText.trim()) return;

    await sendMessage({
      recipient_id: selectedChat,
      content: messageText,
    });
    setMessageText('');
  };

  useEffect(() => {
    if (selectedChat) {
      markAsRead(selectedChat);
    }
  }, [selectedChat, markAsRead]);

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-12 gap-4 min-h-[calc(100vh-8rem)]">
        <div className="col-span-12 md:col-span-4 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Messages</h2>
            <NewMessageDialog onSelectUser={setSelectedChat} />
          </div>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : displayedConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No messages yet
              </div>
            ) : (
              <div className="space-y-2">
                {displayedConversations.map((conv) => (
                  <Card
                    key={conv.other_user_id}
                    className={`p-4 cursor-pointer hover:bg-accent ${
                      selectedChat === conv.other_user_id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedChat(conv.other_user_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{conv.other_user_name}</h3>
                        {conv.is_support_chat && (
                          <p className="text-xs text-blue-400">Support Chat</p>
                        )}
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message?.content}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="col-span-12 md:col-span-8 bg-gray-900/50 rounded-lg">
          {selectedChat ? (
            <div className="h-[calc(100vh-12rem)] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 p-4">
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
                        <p>{message.content}</p>
                        <span className="text-xs opacity-70">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t">
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
            <div className="h-full flex items-center justify-center text-gray-400">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
