
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Users, LogOut } from 'lucide-react';

interface ServerSettingsProps {
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onManageMembers: () => void;
  onLeave: () => void;
}

const ServerSettings = ({ isOwner, onEdit, onDelete, onManageMembers, onLeave }: ServerSettingsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
          <MoreVertical size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 bg-gray-800 border-gray-700 text-white">
        {isOwner ? (
          <>
            <DropdownMenuItem onSelect={onEdit} className="cursor-pointer hover:bg-gray-700">
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit Server</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onManageMembers} className="cursor-pointer hover:bg-gray-700">
              <Users className="mr-2 h-4 w-4" />
              <span>Manage Members</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDelete} className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Server</span>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onSelect={onLeave} className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Leave Server</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ServerSettings;
