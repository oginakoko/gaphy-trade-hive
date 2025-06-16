import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Server } from "@/types/server";
import { useAuth } from "@/hooks/useAuth";
import { useServerMembers } from "@/hooks/useServerMembers";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Crown, Shield, User } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

interface ManageMembersDialogProps {
  server: Server;
  isOpen: boolean;
  onClose: () => void;
}

const ManageMembersDialog = ({ server, isOpen, onClose }: ManageMembersDialogProps) => {
  const { user } = useAuth();
  const { members, removeMember, updateMemberRole } = useServerMembers(server.id);

  const isServerOwner = user?.id === server.owner_id;
  const currentUserRole = members.find(m => m.user_id === user?.id)?.role;

  const handleRemove = (userId: string, username: string) => {
    if (!isServerOwner) {
      toast({
        title: "Permission Denied",
        description: "Only the server owner can remove members.",
        variant: "destructive"
      });
      return;
    }
    
    removeMember({ serverId: server.id, userId }, {
      onSuccess: () => {
        toast({ title: 'Success', description: `${username} has been removed from the server.` });
      },
      onError: (error: any) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    });
  };

  const handleUpdateRole = (userId: string, username: string, newRole: 'owner' | 'moderator' | 'member') => {
    if (!isServerOwner) {
      toast({
        title: "Permission Denied",
        description: "Only the server owner can change member roles.",
        variant: "destructive"
      });
      return;
    }

    updateMemberRole({ serverId: server.id, userId, role: newRole }, {
      onSuccess: () => {
        toast({ title: 'Success', description: `${username}'s role has been updated to ${newRole}.` });
      },
      onError: (error: any) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-card max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            Manage Members
          </DialogTitle>
        </DialogHeader>

        {!isServerOwner && (          <Alert className="mb-4 bg-yellow-500/20 border-yellow-500/50">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              Only the server owner can modify member roles or remove members.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {member.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white text-sm font-medium">
                    {member.profiles?.username || 'Anonymous'}
                    {member.user_id === user?.id && ' (You)'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    {getRoleIcon(member.role)}
                    <span className="capitalize">{member.role}</span>
                  </div>
                </div>
              </div>
              {isServerOwner && member.user_id !== user?.id && (
                <div className="flex items-center gap-2">
                  <Select
                    defaultValue={member.role}
                    onValueChange={(value: 'owner' | 'moderator' | 'member') => 
                      handleUpdateRole(
                        member.user_id,
                        member.profiles?.username || 'Anonymous',
                        value
                      )
                    }
                    disabled={!isServerOwner}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => handleRemove(
                      member.user_id,
                      member.profiles?.username || 'Anonymous'
                    )}
                    className="p-2 text-red-500 hover:bg-gray-700 rounded-lg transition-colors"
                    disabled={!isServerOwner}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageMembersDialog;
