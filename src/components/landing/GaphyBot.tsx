import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, MessageCircle, X, Paperclip, Loader2, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  imageUrl?: string;
}

interface GaphyBotProps {
    onClose: () => void;
}

const GaphyBot = ({ onClose }: GaphyBotProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const scrollViewport = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem('gaphybot-messages');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        setMessages([{ sender: 'bot', text: "Hi! I'm AlphaFinder. Ask me about today's top trade ideas." }]);
      }
    } catch (error) {
      console.error("Failed to parse messages from localStorage", error);
      setMessages([{ sender: 'bot', text: "Hi! I'm AlphaFinder. Ask me about today's top trade ideas." }]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('gaphybot-messages', JSON.stringify(messages));
    }
    if (scrollViewport.current) {
        scrollViewport.current.scrollTo({ top: scrollViewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setIsBotThinking(true);

    try {
      // Filter out image messages, as gemini-pro can't handle them
      const textMessages = newMessages.filter(m => m.text).map(m => ({ sender: m.sender, text: m.text }));

      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { messages: textMessages },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }
      
      const botResponse: Message = { sender: 'bot', text: data.reply };
      setMessages(prev => [...prev, botResponse]);

    } catch (error: any) {
      console.error("Error calling chat-with-ai function:", error);
      const errorMessage = error.message.includes("not configured") 
        ? "The AI assistant is not configured. Please ask an admin to set the API key."
        : "Sorry, I'm having a little trouble right now. Please try again later.";
      
      const botResponse: Message = { sender: 'bot', text: errorMessage };
      setMessages(prev => [...prev, botResponse]);
      toast({ title: 'Chatbot Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsBotThinking(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please log in to upload images.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('trade-ideas').upload(filePath, file);
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('trade-ideas').getPublicUrl(filePath);
      
      const imageMessage: Message = { sender: 'user', text: '', imageUrl: data.publicUrl };
      setMessages(prev => [...prev, imageMessage]);
      
    } catch (error: any) {
      toast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 w-full max-w-md mx-auto flex flex-col h-[60vh] max-h-[700px] min-h-[400px] shadow-2xl animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 p-2 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-green/10 rounded-full">
                <Bot className="w-6 h-6 text-brand-green" />
            </div>
            <div>
              <h3 className="font-bold text-white">AlphaFinder</h3>
              <p className="text-xs text-gray-400">Your AI Trade Assistant</p>
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
        </Button>
      </div>
      <ScrollArea className="flex-grow my-2">
        <div className="p-4 space-y-4" ref={scrollViewport}>
          {messages.map((msg, index) => (
            <div key={index} className={cn('flex items-start gap-3', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.sender === 'bot' && (
                 <div className="p-2 bg-brand-gray-200 rounded-full flex-shrink-0 self-end">
                    <Bot className="w-5 h-5 text-brand-green" />
                 </div>
              )}
               <div className={cn('rounded-lg px-4 py-2 text-white max-w-[80%]', msg.sender === 'user' ? 'bg-brand-green/20' : 'bg-brand-gray-200')}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="User upload" className="rounded-md mb-2 max-w-full h-auto" />
                )}
                {msg.text && <p className="text-sm">{msg.text}</p>}
              </div>
              {msg.sender === 'user' && (
                <div className="p-2 bg-brand-gray-200 rounded-full flex-shrink-0 self-end">
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
          ))}
          {isBotThinking && (
             <div className="flex items-start gap-3 justify-start">
                <div className="p-2 bg-brand-gray-200 rounded-full flex-shrink-0 self-end">
                    <Bot className="w-5 h-5 text-brand-green" />
                </div>
                <div className="rounded-lg px-4 py-2 text-white max-w-[80%] bg-brand-gray-200 flex items-center">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
             </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-2 border-t border-white/10 flex-shrink-0">
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Show top NAS100 ideas"
          className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-white"
          disabled={isUploading || isBotThinking}
        />
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" disabled={isUploading} />
        <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isBotThinking}>
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5 text-gray-400" />}
        </Button>
        <Button type="submit" size="icon" className="bg-brand-green hover:bg-brand-green/80 flex-shrink-0" disabled={isUploading || isBotThinking}>
          <Send className="w-5 h-5 text-black" />
        </Button>
      </form>
    </div>
  );
};

export default GaphyBot;
