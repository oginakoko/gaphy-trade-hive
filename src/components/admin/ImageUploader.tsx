
import React, { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface ImageUploaderProps {
  value?: string;
  onChange: (value: string) => void;
}

const ImageUploader = ({ value, onChange }: ImageUploaderProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user || user.id !== '73938002-b3f8-4444-ad32-6a46cbf8e075') {
      toast({ title: "Unauthorized", description: "You cannot upload images.", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid file type", description: "Please upload an image.", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    try {
      const filePath = `public/${user.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('trade-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('trade-images').getPublicUrl(filePath);

      if (!data.publicUrl) throw new Error("Could not get image URL.");

      onChange(data.publicUrl);
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }, [user, onChange]);

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const onPaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const file = e.clipboardData.files[0];
    if (file && file.type.startsWith('image/')) {
        e.preventDefault();
        handleFileUpload(file);
    }
  }, [handleFileUpload]);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
  };
  
  const handleRemoveImage = () => {
    onChange('');
  };
  
  return (
    <div className="space-y-4">
      <div 
        className={cn(
          "relative border-2 border-dashed border-brand-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-brand-green transition-colors",
          isDragging && "border-brand-green bg-brand-green/10",
          (value || isUploading) && "p-0 border-solid"
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onPaste={onPaste}
        onClick={() => !isUploading && !value && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          accept="image/*" 
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="h-48 w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
          </div>
        ) : value ? (
          <div className="relative group">
            <img src={value} alt="Chart preview" className="rounded-md w-full max-h-96 object-contain" />
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 h-48 text-gray-400">
            <Upload size={32} />
            <p className="font-semibold">Click, paste, or drag & drop an image</p>
            <p className="text-sm">This will be uploaded to storage</p>
          </div>
        )}
      </div>
       <div className="flex items-center">
            <div className="flex-grow border-t border-brand-gray-200/50"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-brand-gray-200/50"></div>
        </div>
        <Input 
            placeholder="Paste an image URL directly" 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)} 
            className="glass-input" 
            disabled={isUploading}
        />
    </div>
  );
};

export default ImageUploader;
