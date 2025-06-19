import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, MessageCircle, X, Paperclip, Loader2, Send, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatWithAI } from '@/lib/openrouter';
import { parseStream } from '@/lib/messageParser';
import type { TradeData } from '@/lib/openrouter';
import type { TradeIdea } from '@/types';
import { Card } from '@/components/ui/card'; // Ensure Card is imported

type Message = {
  sender: 'user' | 'bot';
  text: string;
  imageUrl?: string;
  tradeData?: TradeData | null;
};

type GaphyBotProps = {
  onClose: () => void;
};

const initialMessage: Message = { 
  sender: 'bot', 
  text: "Hi! I'm AlphaFinder, your AI trading assistant. You can ask me to:\n\n- Analyze trade ideas and entries\n- Check risk/reward ratios\n- Extract key trade details\n- Find specific trade setups\n\nHow can I help you today?" 
};

const GaphyBot = ({ onClose }: GaphyBotProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [waitingForTradeIdeaId, setWaitingForTradeIdeaId] = useState<boolean>(false);
  const { user } = useAuth();
  const scrollViewport = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortController = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Initialize messages
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem('gaphybot-messages');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        setMessages([initialMessage]);
      }
    } catch (error) {
      console.error("Failed to parse messages from localStorage", error);
      setMessages([initialMessage]);
    }
  }, []);

  // Save messages and auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('gaphybot-messages', JSON.stringify(messages));
    } else {
      localStorage.removeItem('gaphybot-messages');
    }
    if (scrollViewport.current) {
      scrollViewport.current.scrollTo({ 
        top: scrollViewport.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Cancel any existing streams
    if (abortController.current) {
      abortController.current.abort();
    }

    const userMessage: Message = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsBotThinking(true);

    // If we are waiting for a trade idea ID, process the input as such
    if (waitingForTradeIdeaId) {
      setWaitingForTradeIdeaId(false);
      // Attempt to fetch the trade idea and its analysis
      const tradeIdeaId = input.trim(); // Assuming user provides the ID
      try {
        const { data: tradeIdea, error: ideaError } = await supabase
          .from('trade_ideas')
          .select('*, trade_analysis(*)')
          .eq('id', tradeIdeaId)
          .single();

        if (ideaError || !tradeIdea) {
          setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I couldn\'t find a trade idea with that ID. Please provide the correct ID or ask about a different trade idea.' }]);
        } else {
          // Use the fetched trade idea and analysis as context for the AI
          const tradeContext = `User is asking about Trade Idea ID ${tradeIdea.id}:\nTitle: ${tradeIdea.title}\nInstrument: ${tradeIdea.instrument}\nBreakdown: ${tradeIdea.breakdown}\n\nExisting Analysis: ${tradeIdea.trade_analysis ? JSON.stringify(tradeIdea.trade_analysis) : 'None'}`;
          await sendToAI(newMessages, tradeContext); // Send to AI with context
        }
      } catch (error) {
        console.error('Error fetching trade idea for analysis:', error);
        setMessages(prev => [...prev, { sender: 'bot', text: 'An error occurred while fetching the trade idea. Please try again.' }]);
      } finally {
        setIsBotThinking(false);
      }
      return; // Stop here as we handled the input
    }

    // Check if the user is asking about trade analysis
    const isTradingQuery = /analyze|analysis|trade idea|entry|exit|long|short|buy|sell|stop loss|target|setup/i.test(input.toLowerCase());

    if (isTradingQuery) {
      // Ask the user to specify the trade idea
      setMessages(prev => [...prev, { sender: 'bot', text: 'Which trade idea would you like me to analyze? Please provide the Trade Idea ID.' }]);
      setWaitingForTradeIdeaId(true);
      setIsBotThinking(false); // Stop thinking indicator while waiting for user input
      return; // Stop here, waiting for user to provide ID
    }

    // If not a trade analysis query, send to AI with general context
    await sendToAI(newMessages);
  };

  // Helper function to send messages to the AI
  const sendToAI = async (currentMessages: Message[], context?: string) => {
     setIsBotThinking(true);
     setMessages(prev => [...prev, { sender: 'bot', text: '' }]); // Add empty bot message for streaming

    try {
      abortController.current = new AbortController();

      const chatMessages = [
        ...currentMessages.map(m => ({ 
          role: m.sender === 'user' ? 'user' as const : 'assistant' as const, 
          content: m.text 
        })),
        context ? { 
          role: 'system' as const, 
          content: context 
        } : undefined
      ].filter(Boolean);

      const stream = await chatWithAI(chatMessages, abortController.current.signal);
      const parsedStream = await parseStream(stream);
      const reader = parsedStream.getReader();

      let streamedContent = '';
      while (true) {
        const { done, value } = await reader.read(); // Await the read operation
        if (done) break;
        streamedContent += value;
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.sender === 'bot') {
            return [...prev.slice(0, -1), { ...lastMessage, text: streamedContent }];
          }
          return prev;
        });
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Message stream aborted');
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.sender === 'bot') {
            return [...prev.slice(0, -1), { ...lastMessage, text: lastMessage.text + '\n\n*(Response interrupted)*' }];
          }
          return prev;
        });
      } else {
        console.error('Error streaming message:', error);
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.sender === 'bot') {
            return [...prev.slice(0, -1), { ...lastMessage, text: lastMessage.text + '\n\n*(Error receiving response)*' }];
          }
          return prev;
        });
        toast({
          title: 'AI Error',
          description: 'Failed to get response from AI service.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsBotThinking(false);
      abortController.current = null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `public/${user.id}-${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('bot-uploads') // Ensure you have a storage bucket named 'bot-uploads'
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('bot-uploads')
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      const userMessage: Message = { sender: 'user', text: `Uploaded image: ${file.name}`, imageUrl };
      setMessages(prev => [...prev, userMessage]);

      // Optionally send the image URL to the AI for analysis
      // handleSendMessage(new Event('submit') as any, imageUrl);

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Failed',
        description: 'Could not upload the file.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearChat = () => {
    setMessages([initialMessage]);
    localStorage.removeItem('gaphybot-messages');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <Card className="w-full max-w-md sm:max-w-lg h-full sm:h-auto flex flex-col bg-gray-900 border border-gray-700 shadow-lg rounded-none sm:rounded-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-brand-green" />
            <span className="font-bold text-lg text-white">AlphaFinder AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleClearChat} className="text-gray-400 hover:text-red-400">
              <Trash2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 overflow-y-auto px-2 py-4 sm:px-4">
          <div className="space-y-4" ref={scrollViewport}>
            {messages.map((message, idx) => (
              <div key={idx} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}> 
                <div className={`rounded-lg px-4 py-2 max-w-[80vw] sm:max-w-[70%] ${message.sender === 'user' ? 'bg-brand-green text-black' : 'bg-gray-800 text-white'}`}> 
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="p-2 sm:p-4 border-t border-gray-700 flex items-center space-x-2">
           <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,video/*,audio/*,document/*"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isBotThinking}
            className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBotThinking ? 'Thinking...' : waitingForTradeIdeaId ? 'Enter Trade Idea ID...' : 'Ask AlphaFinder...'}
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-w-0"
            disabled={isBotThinking || isUploading}
          />
          <Button type="submit" disabled={!input.trim() || isBotThinking || isUploading} className="bg-brand-green hover:bg-brand-green/90">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default GaphyBot;
