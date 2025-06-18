import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useFollows';
import { Loader2, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function MessagesDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { conversations = [], sendMessage, markAsRead, loading } = useMessages();
  const { checkMutualFollow } = useFollows();  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  const filteredConversations = conversations ?? [];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !messageText.trim()) return;

    await sendMessage({
      recipient_id: selectedChat,
      content: messageText,
    });
    setMessageText('');
  };

  const selectedConversation = selectedChat 
    ? filteredConversations.find(conv => conv.other_user_id === selectedChat)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-5 w-5" />
        {conversations.some(conv => conv.unread_count > 0) && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
        )}
      </Button>      <DialogContent className="max-w-md sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Messages</DialogTitle>
          <DialogDescription>
            Chat with any user in the platform
          </DialogDescription>
        </DialogHeader>
        <div className="flex h-[500px]">
          {/* Conversations List */}
          <div className="w-1/3 border-r pr-4">            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">Messages</h3>
              <Button variant="secondary" size="sm" onClick={() => setIsNewMessageOpen(true)}>
                New Message
              </Button>
            </div>
            <ScrollArea className="h-[460px]">
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet
                  </p>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.other_user_id}
                      onClick={() => {
                        setSelectedChat(conv.other_user_id);
                        markAsRead(conv.other_user_id);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent text-left",
                        selectedChat === conv.other_user_id && "bg-accent"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={conv.other_user_avatar} />
                        <AvatarFallback>
                          {conv.other_user_name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{conv.other_user_name}</p>
                          {conv.unread_count > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.last_message.content}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Window */}
          <div className="flex-1 pl-4 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="flex items-center gap-2 mb-4">
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
                <form onSubmit={handleSendMessage} className="mt-4">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" disabled={!messageText.trim()}>
                      Send
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
