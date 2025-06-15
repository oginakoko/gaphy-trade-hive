
import { Server } from '@/types/server';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, MessageCircle, Server as ServerIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ServerFeedCardProps {
  server: Server;
}

const ServerFeedCard = ({ server }: ServerFeedCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="glass-card hover:glass-card-hover transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-brand-green mb-2">
          <ServerIcon size={16} />
          <span className="text-sm font-medium">Discover Server</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={server.image_url || undefined} />
            <AvatarFallback className="bg-brand-green text-black font-bold">
              {server.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg">{server.name}</h3>
            <p className="text-gray-400 text-sm">
              by {server.profiles?.username || 'Anonymous'}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-gray-300">{server.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{server.member_count || 0} members</span>
          </div>
        </div>

        <Button 
          onClick={() => navigate('/servers')}
          className="w-full bg-brand-green text-black hover:bg-brand-green/80"
        >
          <MessageCircle size={16} className="mr-2" />
          View All Servers
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServerFeedCard;
