
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useFollows } from '@/hooks/useFollows';
import { useAuth } from '@/hooks/useAuth';

interface UserDiscoveryProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (userId: string) => void;
}

export function UserDiscovery({ isOpen, onClose, onStartChat }: UserDiscoveryProps) {
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const { profiles, loading } = useProfiles();
  const { following, isFollowing, followUser, unfollowUser, checkMutualFollow } = useFollows();

  const filteredUsers = profiles.filter(profile => 
    profile.id !== user?.id &&
    profile.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleFollowToggle = async (userId: string) => {
    if (isFollowing(userId)) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  const handleStartChat = (userId: string) => {
    if (checkMutualFollow(userId)) {
      onStartChat?.(userId);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Discover Users</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No users found
              </p>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((profile) => {
                  const isUserFollowing = isFollowing(profile.id);
                  const isMutualFollow = checkMutualFollow(profile.id);
                  
                  return (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback>
                            {profile.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{profile.username || 'Unknown User'}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {profile.is_admin && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                Admin
                              </span>
                            )}
                            {isMutualFollow && (
                              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                Mutual Follow
                              </span>
                            )}
                            {isUserFollowing && !isMutualFollow && (
                              <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                Following
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isMutualFollow && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartChat(profile.id)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={isUserFollowing ? "secondary" : "default"}
                          onClick={() => handleFollowToggle(profile.id)}
                        >
                          {isUserFollowing ? (
                            <>
                              <UserMinus className="h-4 w-4 mr-1" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Follow
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
