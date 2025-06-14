
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, MessageCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const GaphyBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hi! I'm AlphaFinder. Ask me about today's top trade ideas." }
  ]);
  const [input, setInput] = useState('');
  const scrollViewport = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
        const botResponse: Message = { sender: 'bot', text: "I'm currently in development. Soon you'll be able to ask me for live trade analysis! For now, explore the amazing trade ideas on our platform." };
        setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };
  
  useEffect(() => {
    if (scrollViewport.current) {
        scrollViewport.current.scrollTo({ top: scrollViewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="glass-card rounded-xl p-4 w-full max-w-md mx-auto flex flex-col h-96 shadow-lg animate-fade-in-up" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center gap-3 p-2 border-b border-white/10 flex-shrink-0">
        <div className="p-2 bg-brand-green/10 rounded-full">
            <Bot className="w-6 h-6 text-brand-green" />
        </div>
        <div>
          <h3 className="font-bold text-white">AlphaFinder</h3>
          <p className="text-xs text-gray-400">Your AI Trade Assistant</p>
        </div>
      </div>
      <ScrollArea className="flex-grow my-2">
        <div className="p-4 space-y-4" ref={scrollViewport}>
          {messages.map((msg, index) => (
            <div key={index} className={cn('flex items-start gap-3', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.sender === 'bot' && (
                 <div className="p-2 bg-brand-gray-200 rounded-full flex-shrink-0">
                    <Bot className="w-5 h-5 text-brand-green" />
                 </div>
              )}
               <div className={cn('rounded-lg px-4 py-2 text-white max-w-[80%]', msg.sender === 'user' ? 'bg-brand-green/20' : 'bg-brand-gray-200')}>
                <p className="text-sm">{msg.text}</p>
              </div>
              {msg.sender === 'user' && (
                <div className="p-2 bg-brand-gray-200 rounded-full flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-2 border-t border-white/10 flex-shrink-0">
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Show top NAS100 ideas"
          className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-white"
        />
        <Button type="submit" size="icon" className="bg-brand-green hover:bg-brand-green/80 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-black"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </Button>
      </form>
    </div>
  );
};

export default GaphyBot;
