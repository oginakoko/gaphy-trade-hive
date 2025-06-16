import { Server } from '@/types/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, MessageCircle, Share } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { useShortlinks } from '@/hooks/useShortlinks';

interface ServerCardProps {
  server: Server;
  onJoin: (serverId: string) => void;
  onEnter: (serverId: string) => void;
  isJoining: boolean;
  isMember: boolean;
}

const ServerCard = ({ server, onJoin, onEnter, isJoining, isMember }: ServerCardProps) => {
  const [copiedServerId, setCopiedServerId] = useState<string | null>(null);
  const { createShortlink } = useShortlinks();

  const handleShareServer = async (e: React.MouseEvent, serverId: string, serverName: string) => {
    e.stopPropagation();
    try {
      const longUrl = `${window.location.origin}/servers/${serverId}`;
      
      // Generate shortlink
      const shortCode = await createShortlink.mutateAsync({
        originalUrl: longUrl,
        type: 'server'
      });

      const shortUrl = `${window.location.origin}/s/${shortCode}`;
      
      await navigator.clipboard.writeText(shortUrl);
      setCopiedServerId(serverId);
      toast({
        title: 'Link Copied',
        description: `Short link for "${serverName}" has been copied to clipboard`,
      });
      setTimeout(() => setCopiedServerId(null), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create short link',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="glass-card hover:glass-card-hover transition-all duration-200 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-brand-green mb-2">
          <ServerIcon size={16} />
          <span className="text-sm font-medium">Discover Gaphy Server</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={server.image_url || '/images/servers/default-server.png'} 
              alt={server.name}
              className="object-cover"
            />
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
            onClick={(e) => handleShareServer(e, server.id, server.name)}
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
