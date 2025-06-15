import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import ImageUploader from '@/components/shared/ImageUploader';
import { useServers } from '@/hooks/useServers';
import { toast } from '@/components/ui/use-toast';
import { Server } from '@/types/server';

interface EditServerDialogProps {
  server: Server;
  isOpen: boolean;
  onClose: () => void;
}

const EditServerDialog = ({ server, isOpen, onClose }: EditServerDialogProps) => {
  const [name, setName] = useState(server.name);
  const [description, setDescription] = useState(server.description);
  const [imageUrl, setImageUrl] = useState(server.image_url);
  const [isPublic, setIsPublic] = useState(server.is_public);
  
  const { updateServer, isUpdating } = useServers();

  useEffect(() => {
    if (isOpen) {
        setName(server.name);
        setDescription(server.description);
        setImageUrl(server.image_url);
        setIsPublic(server.is_public);
    }
  }, [server, isOpen]);

  const handleSubmit = () => {
    if (!name.trim() || !description.trim()) {
      toast({
        title: 'Error',
        description: 'Server name and description cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    updateServer({
      id: server.id,
      name: name.trim(),
      description: description.trim(),
      image_url: imageUrl,
      is_public: isPublic,
    }, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Server updated successfully!',
        });
        onClose();
      },
      onError: (error) => {
        toast({
            title: 'Error',
            description: error.message || 'Failed to update server.',
            variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Server</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Server Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-brand-gray-200/50 border-gray-600 text-white" />
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Description *</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-brand-gray-200/50 border-gray-600 text-white resize-none" rows={3} />
          </div>

          <div>
            <Label className="text-white">Server Image</Label>
            <ImageUploader
              value={imageUrl || undefined}
              onChange={setImageUrl}
              bucketName="server-images"
              displayStyle="avatar"
              nameForFallback={name}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="public" checked={isPublic} onCheckedChange={(checked) => setIsPublic(checked as boolean)} />
            <Label htmlFor="public" className="text-white text-sm">Make server public</Label>
          </div>
        </div>
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isUpdating} className="bg-brand-green text-black hover:bg-brand-green/80">
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditServerDialog;
