
import { Server } from '@/types/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, MessageCircle } from 'lucide-react';

interface ServerCardProps {
  server: Server;
  onJoin: (serverId: string) => void;
  onEnter: (serverId: string) => void;
  isJoining: boolean;
  isMember: boolean;
}

const ServerCard = ({ server, onJoin, onEnter, isJoining, isMember }: ServerCardProps) => {
  return (
    <Card className="glass-card hover:glass-card-hover transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={server.image_url || undefined} />
            <AvatarFallback className="bg-brand-green text-black font-bold">
              {server.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-white text-lg">{server.name}</CardTitle>
            <p className="text-gray-400 text-sm">
              by {server.profiles?.username || 'Anonymous'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-300 text-sm">{server.description}</p>
        
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
