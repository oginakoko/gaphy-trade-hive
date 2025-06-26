import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadIcon } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

const ImageUploader = ({ value, onChange }: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setPreview(url);
    onChange(url);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          value={value}
          onChange={handleUrlChange}
          placeholder="Enter image URL"
          className="glass-input"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          className="flex items-center space-x-2 text-white border-gray-600 hover:bg-gray-700"
        >
          <UploadIcon className="w-4 h-4" />
          <span>Upload</span>
        </Button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>
      {preview && (
        <div className="mt-2">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-md border border-gray-700"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
