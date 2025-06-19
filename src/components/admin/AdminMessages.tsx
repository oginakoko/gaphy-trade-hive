import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useProfiles } from '@/hooks/useProfiles';
import { Loader2, Search, MessageCircle, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { BroadcastDialog } from '../messages/BroadcastDialog';
import { useNavigate } from 'react-router-dom';

export function AdminMessages() {
  const { user } = useAuth();
  const { conversations = [], sendMessage, markAsRead, loading } = useMessages();
  const { profiles: allUsers = [], loading: loadingUsers } = useProfiles();
  const [messageText, setMessageText] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const navigate = useNavigate();

  // Filter users based on search
  const filteredUsers = allUsers.filter(u => 
    u.id !== user?.id && // Don't show current user
    (!search || 
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    )
  );

  // Get the selected conversation
  const selectedConversation = selectedUserId 
    ? conversations.find(conv => conv.other_user_id === selectedUserId)
    : null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !messageText.trim()) return;

    await sendMessage({
      recipient_id: selectedUserId,
      content: messageText,
    });
    setMessageText('');
  };

  useEffect(() => {
    if (selectedUserId) {
      markAsRead(selectedUserId).catch(console.error);
    }
  }, [selectedUserId, markAsRead]);

  return (
    <>
      {/* Header with back button */}
      <div className="p-6 animate-fade-in-up">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-4xl font-bold text-white">User Messages</h1>
        </div>
      </div>

      <div className="h-[calc(100vh-132px)] flex bg-background">
        {/* Users List */}
        <div className="w-80 border-r border-gray-700 bg-gray-900/50">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">All Users</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBroadcast(true)}
                className="border-brand-green/30 text-brand-green hover:bg-brand-green/10"
              >
                Broadcast
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-1 p-2">
              {(loadingUsers || loading) ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No users found
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const conv = conversations.find(c => c.other_user_id === u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/60 text-left transition-colors",
                        selectedUserId === u.id && "bg-gray-800 border border-brand-green/20",
                        "relative"
                      )}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="bg-gray-700 text-white">
                          {u.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {u.username || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {u.email || 'No email'}
                        </p>
                      </div>
                      {conv?.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-brand-green text-black text-xs font-bold rounded-full flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-700 bg-gray-900/50">
            {selectedUserId && selectedConversation ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.other_user_avatar} />
                  <AvatarFallback className="bg-gray-700 text-white">
                    {selectedConversation.other_user_name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-white">
                    {selectedConversation.other_user_name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedConversation.other_user?.email}
                  </p>
                </div>
              </div>
            ) : (
              <h2 className="font-semibold text-white">Select a user to start messaging</h2>
            )}
          </div>

          <ScrollArea className="flex-1 p-4">
            {selectedUserId ? (
              <div className="space-y-4">
                {selectedConversation?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 max-w-[80%]",
                      message.sender_id === user?.id ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {message.sender_id !== user?.id && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.sender?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gray-700 text-white text-sm">
                          {message.sender?.username?.[0]?.toUpperCase() || 'U'}
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
                      <p className="text-sm break-words">{message.content}</p>
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
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-white font-medium mb-2">Select a User</h3>
                  <p className="text-sm text-gray-400">
                    Choose a user from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-gray-900/50">
            <div className="flex gap-3">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={selectedUserId ? "Type your message..." : "Select a user first"}
                disabled={!selectedUserId}
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
              <Button 
                type="submit"
                disabled={!selectedUserId || !messageText.trim()}
                className="bg-brand-green hover:bg-brand-green/90 text-black font-medium px-6"
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>

      <BroadcastDialog
        isOpen={showBroadcast}
        onClose={() => setShowBroadcast(false)}
      />
    </>
  );
}
