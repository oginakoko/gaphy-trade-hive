
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
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700">
        <DialogHeader className="pb-4 border-b border-gray-700">
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
              <div className="space-y-3">
                {filteredUsers.map((profile) => {
                  const isUserFollowing = isFollowing(profile.id);
                  const isMutualFollow = checkMutualFollow(profile.id);
                  
                  return (
                    <Card
                      key={profile.id}
                      className="p-4 bg-gray-800/50 border-gray-700 hover:bg-gray-800/80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-gray-600">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="bg-gray-700 text-white font-medium">
                              {profile.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-white">{profile.username || 'Unknown Trader'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {profile.is_admin && (
                                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                                  Admin
                                </span>
                              )}
                              {isMutualFollow && (
                                <span className="bg-brand-green/20 text-brand-green px-2 py-1 rounded-full text-xs font-medium">
                                  Mutual Follow
                                </span>
                              )}
                              {isUserFollowing && !isMutualFollow && (
                                <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full text-xs font-medium">
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
                              onClick={() => handleStartChat(profile.id)}
                              className="bg-brand-green hover:bg-brand-green/80 text-black font-medium"
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Chat
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={isUserFollowing ? "secondary" : "default"}
                            onClick={() => handleFollowToggle(profile.id)}
                            className={cn(
                              "font-medium",
                              isUserFollowing 
                                ? "bg-gray-600 hover:bg-gray-700 text-white" 
                                : "bg-brand-green/20 hover:bg-brand-green/30 text-brand-green border border-brand-green/30"
                            )}
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
                    </Card>
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
