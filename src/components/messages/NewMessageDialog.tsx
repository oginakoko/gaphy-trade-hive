import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  username: string;
  avatar_url?: string;
}

interface NewMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

export function NewMessageDialog({ isOpen, onClose, onSelectUser }: NewMessageDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from('auth.users')
          .select('id, raw_user_meta_data')
          .neq('id', user?.id);

        if (error) throw error;

        const formattedUsers = data.map(u => ({
          id: u.id,
          username: u.raw_user_meta_data?.username || 'Unknown User',
          avatar_url: u.raw_user_meta_data?.avatar_url
        }));

        setUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, user?.id]);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectUser = (userId: string) => {
    onSelectUser(userId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                No users found
              </p>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent text-left"
                    onClick={() => handleSelectUser(user.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.username}
                      </p>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
