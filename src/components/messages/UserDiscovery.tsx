import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, UserPlus, UserMinus, MessageCircle, Search } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types';
import { useBlockUser } from '@/hooks/useBlockUser';

interface UserDiscoveryProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (userId: string) => void;
}

export function UserDiscovery({ isOpen, onClose, onStartChat }: UserDiscoveryProps) {
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const { profiles, loading } = useProfiles(search);
  const { toast } = useToast();
  const { blockUser, unblockUser, isBlockedByMe } = useBlockUser();
  const [followLoading, setFollowLoading] = useState<string | null>(null); // Renamed to be more generic for any action loading

  const filteredUsers = profiles?.filter(profile =>
    profile.id !== user?.id &&
    (!search || profile.username?.toLowerCase().includes(search.toLowerCase()))
  ).map(profile => ({
    ...profile,
    is_blocked_by_me: isBlockedByMe(profile.id),
  })) || [];

  const handleBlockToggle = async (userId: string, currentlyBlocked: boolean) => {
    if (!user) return;

    setFollowLoading(userId); // Using the same loading state for simplicity
    try {
      if (currentlyBlocked) {
        await unblockUser(userId);
        toast({
          description: 'User unblocked successfully',
        });
      } else {
        await blockUser(userId);
        toast({
          description: 'User blocked successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update block status',
        variant: 'destructive',
      });
    } finally {
      setFollowLoading(null);
    }
  };

  const handleStartChat = (userId: string, isBlocked: boolean) => {
    if (isBlocked) {
      toast({
        description: 'You cannot message a user who has blocked you.',
        variant: 'destructive',
      });
      return;
    }
    onStartChat?.(userId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Discover Traders</DialogTitle>
          <DialogDescription className="text-gray-400">Find and connect with other traders in the community</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search traders by username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-brand-green"
            />
          </div>

          <ScrollArea className="h-[500px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-400">
                  {search ? 'No traders found matching your search' : 'No traders found'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((profile) => (
                  <Card
                    key={profile.id}
                    className={cn(
                      'p-4 transition-colors border-gray-700 hover:bg-gray-800/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url || ''} />
                          <AvatarFallback className="bg-gray-700 text-white">
                            {profile.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-white">{profile.username}</h4>
                          {profile.is_admin && (
                            <p className="text-sm text-blue-400">Admin</p>
                          )}
                          {profile.is_blocked_by_me && (
                            <p className="text-sm text-red-400">Blocked</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!profile.is_admin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBlockToggle(profile.id, profile.is_blocked_by_me)}
                            disabled={followLoading === profile.id}
                            className={cn(
                              'border-gray-700',
                              profile.is_blocked_by_me
                                ? 'text-red-400 hover:text-red-300 hover:border-red-400/30'
                                : 'text-yellow-400 hover:text-yellow-300 hover:border-yellow-400/30'
                            )}
                          >
                            {followLoading === profile.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : profile.is_blocked_by_me ? (
                              <UserMinus className="h-4 w-4 mr-1" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-1" />
                            )}
                            {profile.is_blocked_by_me ? 'Unblock' : 'Block'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartChat(profile.id, profile.is_blocked_by_me || false)}
                          className="text-brand-green border-brand-green/30 hover:bg-brand-green/10"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
