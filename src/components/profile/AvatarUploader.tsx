
import React, { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Upload, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarUploaderProps {
  value?: string;
  onChange: (value: string) => void;
  username?: string | null;
}

const AvatarUploader = ({ value, onChange, username }: AvatarUploaderProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) {
      toast({ title: "Unauthorized", description: "You must be logged in to upload an image.", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid file type", description: "Please upload an image.", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      if (!data.publicUrl) throw new Error("Could not get image URL.");

      onChange(`${data.publicUrl}?t=${new Date().getTime()}`);
      toast({ title: "Success", description: "Avatar updated successfully." });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: `Please ensure an 'avatars' bucket exists in your Supabase storage with correct RLS policies. Error: ${error.message}`, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }, [user, onChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
  };
  
  const getInitials = (name?: string | null) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : <User size={48} />;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-2 border-dashed border-muted group-hover:border-primary transition-colors">
          <AvatarImage src={value || undefined} alt={username || 'User avatar'} />
          <AvatarFallback className="text-3xl bg-transparent">
            {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : getInitials(username)}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <Upload size={16} />
          <span className="sr-only">Upload new avatar</span>
        </button>
      </div>
       <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          accept="image/*" 
          disabled={isUploading}
        />
    </div>
  );
};

export default AvatarUploader;
