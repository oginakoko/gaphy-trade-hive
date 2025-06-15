
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send } from 'lucide-react';

interface ServerMessageInputProps {
  onSendMessage: (message: string, file: File | null) => void;
  isSending: boolean;
}

const ServerMessageInput = ({ onSendMessage, isSending }: ServerMessageInputProps) => {
  const [message, setMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !mediaFile) return;

    onSendMessage(message.trim(), mediaFile);

    setMessage('');
    setMediaFile(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
    }
  };

  return (
    <div className="p-4 border-t border-gray-700 shrink-0">
      {mediaFile && (
        <div className="mb-2 p-2 bg-gray-700 rounded flex items-center justify-between">
          <span className="text-sm text-gray-300 truncate">
            {mediaFile.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMediaFile(null)
              if(fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-gray-400 hover:text-white"
          >
            ×
          </Button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-400 hover:text-white"
        >
          <Paperclip size={20} />
        </Button>
        
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-700 border-gray-600 text-white"
          autoComplete="off"
        />
        
        <Button
          type="submit"
          disabled={isSending || (!message.trim() && !mediaFile)}
          className="bg-brand-green text-black hover:bg-brand-green/80"
        >
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
};

export default ServerMessageInput;
