
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface ImageUploaderProps {
  value?: string;
  onChange: (value: string | null) => void;
  bucketName: string;
}

const ImageUploader = ({ value, onChange, bucketName }: ImageUploaderProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      if (!user) {
        throw new Error('You must be logged in to upload an image.');
      }

      setIsUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // Store in user-specific folder

      const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      onChange(data.publicUrl);
      toast({ title: 'Success', description: 'Image uploaded successfully.' });
    } catch (error: any) {
      toast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveImage = async () => {
    if (!value || !user) return;
    try {
        const pathToFile = value.substring(value.lastIndexOf(bucketName) + bucketName.length + 1);
        
        const { error } = await supabase.storage.from(bucketName).remove([pathToFile]);
        if (error) throw error;
        
        onChange(null);
        toast({ title: 'Success', description: 'Image removed.' });
    } catch (error: any) {
        toast({ title: 'Error removing image', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div>
      {value ? (
        <div className="relative group">
          <img src={value} alt="Uploaded image" className="w-full h-auto rounded-lg object-cover" />
           <Button 
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-brand-gray-200/50 hover:bg-brand-gray-200/70 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              ) : (
                <>
                    <UploadCloud className="w-8 h-8 mb-4 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x400px)</p>
                </>
              )}
            </div>
            <Input id="image-upload" type="file" className="hidden" onChange={handleUpload} disabled={isUploading} accept="image/*" />
          </label>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
