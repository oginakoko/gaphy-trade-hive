
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useServerMembers } from '@/hooks/useServerMembers';
import { Server } from '@/types/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '../ui/use-toast';
import { Skeleton } from '../ui/skeleton';

interface ManageMembersDialogProps {
  server: Server;
  isOpen: boolean;
  onClose: () => void;
}

const ManageMembersDialog = ({ server, isOpen, onClose }: ManageMembersDialogProps) => {
  const { members, isLoading, removeMember, isRemovingMember } = useServerMembers(server.id);
  const { user } = useAuth();

  const handleRemoveMember = (userId: string) => {
    removeMember({ serverId: server.id, userId }, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Member removed from server.' });
      },
      onError: (error: any) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle className="text-white">Manage Members</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-3 w-[100px]" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-20 rounded-md" />
                </div>
            ))
          ) : (
            members.map(member => (
              <div key={member.id} className="flex items-center justify-between hover:bg-white/5 p-2 rounded-md">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.profiles?.avatar_url || ''} />
                    <AvatarFallback>{member.profiles?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">{member.profiles?.username}</p>
                    <p className="text-gray-400 text-sm capitalize">{member.role}</p>
                  </div>
                </div>
                {server.owner_id === user?.id && member.user_id !== server.owner_id && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMember(member.user_id)}
                    disabled={isRemovingMember}
                  >
                    <X size={16} className="mr-1" /> Remove
                  </Button>
                )}
                {member.user_id === server.owner_id && (
                    <span className="text-xs text-brand-green font-bold uppercase">Owner</span>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageMembersDialog;
