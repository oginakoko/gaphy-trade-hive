
import { Server } from '@/types/server';
import { Button } from '@/components/ui/button';
import { Users, Lock, Share } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

interface CompactServerCardProps {
  server: Server;
  onJoin: (serverId: string) => void;
  isJoining: boolean;
}

const CompactServerCard = ({ server, onJoin, isJoining }: CompactServerCardProps) => {
    const navigate = useNavigate();
    const [copiedServerId, setCopiedServerId] = useState<string | null>(null);
    
    const handleCardClick = () => {
        navigate(`/servers`);
    };

    const handleShareServer = async (e: React.MouseEvent, serverId: string, serverName: string) => {
        e.stopPropagation();
        const shareUrl = `${window.location.origin}/servers?server_id=${serverId}`;
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
    <div className="p-3 bg-white/5 rounded-lg flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer" onClick={handleCardClick}>
      <img src={server.image_url || '/placeholder.svg'} alt={server.name} className="w-12 h-12 rounded-md object-cover" />
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-white truncate">{server.name}</h4>
        <div className="flex items-center text-xs text-gray-400 gap-2">
            <div className="flex items-center gap-1">
                <Users size={12} />
                <span>{server.member_count || 0}</span>
            </div>
             {!server.is_public && <Lock size={12} />}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button 
          size="sm" 
          variant="outline"
          onClick={(e) => handleShareServer(e, server.id, server.name)} 
          className="p-1 h-8 w-8"
        >
          <Share size={12} />
        </Button>
        <Button 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onJoin(server.id); }} 
          disabled={isJoining} 
          className="bg-brand-green text-black hover:bg-brand-green/80 flex-shrink-0"
        >
          {isJoining ? '...' : 'Join'}
        </Button>
      </div>
    </div>
  );
};

export default CompactServerCard;
