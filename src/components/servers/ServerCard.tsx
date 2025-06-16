
import { Server } from '@/types/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, MessageCircle, Share } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

interface ServerCardProps {
  server: Server;
  onJoin: (serverId: string) => void;
  onEnter: (serverId: string) => void;
  isJoining: boolean;
  isMember: boolean;
}

const ServerCard = ({ server, onJoin, onEnter, isJoining, isMember }: ServerCardProps) => {
  const [copiedServerId, setCopiedServerId] = useState<string | null>(null);

  const handleShareServer = async (serverId: string, serverName: string) => {
    const shareUrl = `${window.location.origin}/servers/${serverId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedServerId(serverId);
      toast({
        title: 'Link Copied',
        description: `"${serverName}" server link has been copied to clipboard`,
      });
      setTimeout(() => setCopiedServerId(null), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="glass-card hover:glass-card-hover transition-all duration-200 flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={server.image_url || undefined} />
            <AvatarFallback className="bg-brand-green text-black font-bold">
              {server.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-white text-base truncate">{server.name}</CardTitle>
            <p className="text-gray-400 text-sm truncate">
              by {server.profiles?.username || 'Anonymous'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleShareServer(server.id, server.name)}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <Share size={12} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3 flex-grow flex flex-col">
        <p className="text-gray-300 text-sm flex-grow">{server.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{server.member_count || 0} members</span>
          </div>
        </div>

        <div className="flex gap-2">
          {isMember ? (
            <Button 
              onClick={() => onEnter(server.id)}
              className="flex-1 bg-brand-green text-black hover:bg-brand-green/80"
            >
              <MessageCircle size={16} className="mr-2" />
              Enter Server
            </Button>
          ) : (
            <Button 
              onClick={() => onJoin(server.id)}
              disabled={isJoining}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              {isJoining ? 'Joining...' : 'Join Server'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerCard;
