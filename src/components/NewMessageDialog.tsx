
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquarePlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProfiles } from '@/hooks/useProfiles';

interface NewMessageDialogProps {
  onSelectUser: (userId: string) => void;
}

export function NewMessageDialog({ onSelectUser }: NewMessageDialogProps) {
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const { profiles, loading: profilesLoading } = useProfiles();
  const [open, setOpen] = useState(false);

  const filteredUsers = profiles.filter((profile) =>
    profile.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectUser = (userId: string) => {
    onSelectUser(userId);
    setOpen(false); // Close the dialog after selecting a user
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <MessageSquarePlus className="mr-2 h-4 w-4" /> New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Start a new conversation with a user.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {profilesLoading ? (
                <div className="text-center text-gray-400">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center text-gray-400">No users found.</div>
              ) : (
                filteredUsers.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleSelectUser(profile.id)}
                  >
                    <div className="flex items-center gap-2">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.username || 'User'}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {profile.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <span>{profile.username || 'Unknown User'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
