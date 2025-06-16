import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ServerMessage } from '@/types/server';
import ServerMessageItem from './ServerMessageItem';

interface ServerMessageListProps {
  messages: ServerMessage[];
  onDeleteMessage: (messageId: string) => void;
  serverOwnerId: string;
  onReply: (message: ServerMessage) => void;
  serverId: string;  // Added serverId prop
}

const ServerMessageList = ({ messages, onDeleteMessage, serverOwnerId, onReply, serverId }: ServerMessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // A small delay to allow images to load before scrolling
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((msg) => (
          <ServerMessageItem 
            key={msg.id} 
            msg={msg} 
            onDelete={onDeleteMessage} 
            serverOwnerId={serverOwnerId} 
            onReply={onReply}
            serverId={serverId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ServerMessageList;
