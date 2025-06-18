import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, Video, Image, X, Plus } from 'lucide-react';
import { MediaItem } from '@/types/media';
import { toast } from '@/components/ui/use-toast';

interface MediaSelectorProps {
  onAdd: (item: MediaItem) => void;
  onClose: () => void;
}

const MediaSelector = ({ onAdd, onClose }: MediaSelectorProps) => {
  const [activeTab, setActiveTab] = useState('image');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetForm = () => {
    setFormData({ title: '', description: '', url: '' });
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = activeTab === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for image
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `File size must be less than ${activeTab === 'video' ? '100MB' : '10MB'}`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    if (!formData.title) {
      setFormData(prev => ({ ...prev, title: file.name.split('.')[0] }));
    }
  };

  const handleAddMedia = () => {
    if (activeTab === 'link') {
      if (!formData.url.trim()) {
        toast({
          title: 'URL required',
          description: 'Please enter a valid URL',
          variant: 'destructive',
        });
        return;
      }

      onAdd({
        id: '',
        type: 'link',
        url: formData.url,
        title: formData.title || formData.url,
        description: formData.description,
      });
    } else {
      if (formData.url.trim()) {
        // URL provided
        onAdd({
          id: '',
          type: activeTab as 'image' | 'video',
          url: formData.url,
          title: formData.title || formData.url,
          description: formData.description,
        });
      } else if (selectedFile) {
        // File selected
        onAdd({
          id: '',
          type: activeTab as 'image' | 'video',
          url: URL.createObjectURL(selectedFile),
          title: formData.title || selectedFile.name,
          description: formData.description,
          file: selectedFile,
        });
      } else {
        toast({
          title: 'Media required',
          description: 'Please select a file or provide a URL',
          variant: 'destructive',
        });
        return;
      }
    }

    resetForm();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="glass-card border-brand-green/20 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus size={20} />
            Add Media Content
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image size={16} />
              Image
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video size={16} />
              Video
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link size={16} />
              Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Upload Image or Provide URL
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-brand-gray-200/20 hover:bg-brand-gray-200/30">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-400">
                        {selectedFile ? selectedFile.name : 'Click to upload image'}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
                <div className="text-center text-gray-400">OR</div>
                <Input
                  placeholder="Paste image URL"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="glass-input"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Upload Video or Provide URL
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-brand-gray-200/20 hover:bg-brand-gray-200/30">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-400">
                        {selectedFile ? selectedFile.name : 'Click to upload video'}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
                <div className="text-center text-gray-400">OR</div>
                <Input
                  placeholder="Paste video URL (YouTube, Vimeo, etc.)"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="glass-input"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                URL *
              </label>
              <Input
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="glass-input"
                required
              />
            </div>
          </TabsContent>

          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Title (Optional)
              </label>
              <Input
                placeholder="Enter a title for this media"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="glass-input"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <Textarea
                placeholder="Add a description or caption"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="glass-input"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMedia}
              className="flex-1 bg-brand-green text-black hover:bg-brand-green/80"
            >
              Add Media
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MediaSelector;
