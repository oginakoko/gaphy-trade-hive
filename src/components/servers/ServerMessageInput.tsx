
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/hooks/useAuth';

interface ServerMessageInputProps {
  onSendMessage: (message: string, file: File | null) => void;
  isSending: boolean;
  members: { id: string; username: string | null; avatar_url: string | null; }[];
}

const ServerMessageInput = ({ onSendMessage, isSending, members }: ServerMessageInputProps) => {
  const [message, setMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<{ id: string; username: string | null; avatar_url: string | null; }[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (mentionQuery) {
      setFilteredMembers(
        members.filter(m => 
          m.id !== user?.id && m.username?.toLowerCase().startsWith(mentionQuery.toLowerCase())
        ).slice(0, 5)
      );
    } else {
      setFilteredMembers([]);
    }
  }, [mentionQuery, members, user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastWordMatch = textBeforeCursor.match(/@(\w*)$/);

    if (lastWordMatch) {
      setMentionQuery(lastWordMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (username: string) => {
    const currentMessage = message;
    const cursorPos = (document.getElementById('message-input') as HTMLInputElement)?.selectionStart || 0;
    const textBeforeCursor = currentMessage.substring(0, cursorPos);
    
    const lastAtMatch = textBeforeCursor.match(/@\w*$/);
    if (!lastAtMatch) return;

    const startIndex = lastAtMatch.index || 0;

    const newMessage =
      currentMessage.substring(0, startIndex) +
      `@${username} ` +
      currentMessage.substring(cursorPos);

    setMessage(newMessage);
    setShowMentions(false);
    setTimeout(() => {
        const input = document.getElementById('message-input') as HTMLInputElement;
        input?.focus();
        input.selectionStart = input.selectionEnd = startIndex + username.length + 2;
    }, 0);
  };

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
    <div className="p-4 border-t border-gray-700 shrink-0 relative">
        {showMentions && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 p-1">
            <ul>
                {filteredMembers.map(member => (
                <li 
                    key={member.id}
                    onClick={() => handleMentionSelect(member.username || '')}
                    className="p-2 flex items-center gap-2 hover:bg-gray-700 rounded cursor-pointer text-white"
                >
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback>{member.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{member.username}</span>
                </li>
                ))}
            </ul>
            </div>
        )}

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
          id="message-input"
          value={message}
          onChange={handleInputChange}
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
