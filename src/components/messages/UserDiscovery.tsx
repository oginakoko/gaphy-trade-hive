import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, UserPlus, UserMinus, MessageCircle, Search } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useFollows } from '@/hooks/useFollows';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types';

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
  const { following, isFollowing, followUser, unfollowUser, checkMutualFollow } = useFollows();
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  const filteredUsers = profiles?.filter(profile => 
    profile.id !== user?.id && 
    (!search || profile.username?.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  const handleFollowToggle = async (userId: string) => {
    if (!user) return;
    
    setFollowLoading(userId);
    try {
      if (isFollowing(userId)) {
        await unfollowUser(userId);
        toast({
          description: 'User unfollowed successfully',
        });
      } else {
        await followUser(userId);
        toast({
          description: 'User followed successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setFollowLoading(null);
    }
  };

  const handleStartChat = (userId: string) => {
    const canChat = checkMutualFollow(userId);
    if (canChat) {
      onStartChat?.(userId);
      onClose();
    } else {
      toast({
        description: 'You need to follow each other to start a chat',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Discover Traders</DialogTitle>
          <p className="text-gray-400">Find and connect with other traders in the community</p>
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
                      'p-4 transition-colors border-gray-700 hover:bg-gray-800/50',
                      checkMutualFollow(profile.id) && 'bg-brand-green/10 border-brand-green/30'
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
                          {checkMutualFollow(profile.id) && (
                            <p className="text-sm text-brand-green">Mutual Follow</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFollowToggle(profile.id)}
                          disabled={followLoading === profile.id}
                          className={cn(
                            'border-gray-700',
                            isFollowing(profile.id)
                              ? 'text-red-400 hover:text-red-300 hover:border-red-400/30'
                              : 'text-brand-green hover:text-brand-green/90 hover:border-brand-green/30'
                          )}
                        >
                          {followLoading === profile.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isFollowing(profile.id) ? (
                            <UserMinus className="h-4 w-4" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                        {checkMutualFollow(profile.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartChat(profile.id)}
                            className="text-brand-green border-brand-green/30 hover:bg-brand-green/10"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
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
