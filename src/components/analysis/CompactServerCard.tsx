
import { Server } from '@/types/server';
import { Button } from '@/components/ui/button';
import { Users, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CompactServerCardProps {
  server: Server;
  onJoin: (serverId: string) => void;
  isJoining: boolean;
}

const CompactServerCard = ({ server, onJoin, isJoining }: CompactServerCardProps) => {
    const navigate = useNavigate();
    
    const handleCardClick = () => {
        navigate(`/servers`);
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
      <Button size="sm" onClick={(e) => { e.stopPropagation(); onJoin(server.id); }} disabled={isJoining} className="bg-brand-green text-black hover:bg-brand-green/80 flex-shrink-0">
        {isJoining ? '...' : 'Join'}
      </Button>
    </div>
  );
};

export default CompactServerCard;
