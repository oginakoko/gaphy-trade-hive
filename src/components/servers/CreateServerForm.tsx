
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUploader from '@/components/shared/ImageUploader';
import { useServers } from '@/hooks/useServers';
import { toast } from '@/components/ui/use-toast';

interface CreateServerFormProps {
  onClose: () => void;
}

const CreateServerForm = ({ onClose }: CreateServerFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  
  const { createServer, isCreating } = useServers();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    createServer({
      name: name.trim(),
      description: description.trim(),
      image_url: imageUrl,
      is_public: isPublic,
    });

    toast({
      title: 'Success',
      description: 'Server created successfully!',
    });

    onClose();
  };

  return (
    <Card className="glass-card max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-white">Create New Server</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Server Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter server name"
              className="bg-brand-gray-200/50 border-gray-600 text-white"
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your server"
              className="bg-brand-gray-200/50 border-gray-600 text-white resize-none"
              rows={3}
              maxLength={200}
            />
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
            <Checkbox
              id="public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked as boolean)}
            />
            <Label htmlFor="public" className="text-white text-sm">
              Make server public (others can discover and join)
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1 bg-brand-green text-black hover:bg-brand-green/80"
            >
              {isCreating ? 'Creating...' : 'Create Server'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateServerForm;
