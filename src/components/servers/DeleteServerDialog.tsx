
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useServers } from "@/hooks/useServers";
import { toast } from "../ui/use-toast";

interface DeleteServerDialogProps {
  serverId: string;
  serverName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteServerDialog = ({ serverId, serverName, isOpen, onClose, onSuccess }: DeleteServerDialogProps) => {
  const { deleteServer, isDeleting } = useServers();

  const handleDelete = () => {
    deleteServer(serverId, {
        onSuccess: () => {
            toast({
                title: 'Server Deleted',
                description: `The server "${serverName}" has been permanently deleted.`,
            });
            onSuccess();
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete server.',
                variant: 'destructive',
            });
            onClose();
        }
    });
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="glass-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            This action cannot be undone. This will permanently delete the
            <strong className="text-white"> {serverName} </strong>
            server and remove all its data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting ? 'Deleting...' : 'Yes, delete server'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteServerDialog;
