
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';
import { Server } from '@/types/server';
import { useAuth } from '@/hooks/useAuth';
import ServerSettings from './ServerSettings';

interface ServerChatHeaderProps {
  server: Server;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onManageMembers: () => void;
}

const ServerChatHeader = ({ server, onBack, onEdit, onDelete, onManageMembers }: ServerChatHeaderProps) => {
  const { user } = useAuth();
  const isOwner = user?.id === server.owner_id;

  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-700 shrink-0">
      <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-700">
        <ArrowLeft size={20} />
      </Button>
      <Avatar className="h-8 w-8">
        <AvatarImage src={server.image_url || undefined} />
        <AvatarFallback className="bg-brand-green text-black text-sm">
          {server.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h3 className="text-white font-semibold">{server.name}</h3>
        <p className="text-gray-400 text-sm">{server.member_count || 0} members</p>
      </div>
      {isOwner && <ServerSettings onEdit={onEdit} onDelete={onDelete} onManageMembers={onManageMembers} />}
    </div>
  );
};

export default ServerChatHeader;
