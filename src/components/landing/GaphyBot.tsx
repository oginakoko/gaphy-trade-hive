import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, MessageCircle, X, Paperclip, Loader2, Send } from 'lucide-react';
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

type Message = {
  sender: 'user' | 'bot';
  text: string;
  imageUrl?: string;
  tradeData?: TradeData | null;
};

type GaphyBotProps = {
  onClose: () => void;
};

const GaphyBot = ({ onClose }: GaphyBotProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
        setMessages([{ 
          sender: 'bot', 
          text: "Hi! I'm AlphaFinder, your AI trading assistant. You can ask me to:\n\n- Analyze trade ideas and entries\n- Check risk/reward ratios\n- Extract key trade details\n- Find specific trade setups\n\nHow can I help you today?" 
        }]);
      }
    } catch (error) {
      console.error("Failed to parse messages from localStorage", error);
      setMessages([{ 
        sender: 'bot', 
        text: "Hi! I'm AlphaFinder. Ask me about today's top trade ideas." 
      }]);
    }
  }, []);

  // Save messages and auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('gaphybot-messages', JSON.stringify(messages));
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

    // Create an empty bot message that we'll stream content into
    setMessages(prev => [...prev, { sender: 'bot', text: '' }]);

    try {
      // Create a new abort controller for this request
      abortController.current = new AbortController();

      // Check for trade analysis in the database first
      let tradeAnalysis = '';
      const isTradingQuery = /trade|entry|exit|long|short|buy|sell|stop loss|target|analysis|setup/i.test(input.toLowerCase());
      
      if (isTradingQuery) {
        try {
          const { data: analyses, error: analysisError } = await supabase
            .from('trade_analysis')
            .select(`
              *,
              trade_ideas(title, instrument, created_at)
            `)
            .textSearch('analyzed_text', input.replace(/[^\w\s]/g, ' '))
            .order('created_at', { ascending: false })
            .limit(3);

          if (!analysisError && analyses?.length > 0) {
            tradeAnalysis = "Here are some relevant trade analyses I found:\n\n" + 
              analyses.map(analysis => {
                const idea = analysis.trade_ideas;
                const tradeId = analysis.trade_idea_id;
                return `**${idea.title}** (${idea.instrument}) - [View Trade](#/trade-ideas/${tradeId})\n` +
                  `- Direction: ${analysis.direction || 'Not specified'}\n` +
                  `- Entry: ${analysis.entry_price || 'Not specified'}\n` +
                  `- Target: ${analysis.target_price || 'Not specified'}\n` +
                  `- Stop Loss: ${analysis.stop_loss || 'Not specified'}\n` +
                  (analysis.risk_reward ? `- Risk/Reward: ${analysis.risk_reward}\n` : '') +
                  `- Key Points: ${analysis.key_points?.join(', ') || 'None provided'}\n`;
              }).join('\n');
          }
        } catch (error) {
          console.error('Error fetching trade analysis:', error);
        }
      }

      // Create chat context
      const chatMessages = [
        ...newMessages.map(m => ({ 
          role: m.sender === 'user' ? 'user' as const : 'assistant' as const, 
          content: m.text 
        })),
        tradeAnalysis ? { 
          role: 'system' as const, 
          content: `Previous analysis found:\n${tradeAnalysis}\n\nIncorporate this into your response if relevant.` 
        } : undefined
      ].filter(Boolean);

      // Get streaming response
      const stream = await chatWithAI(chatMessages, abortController.current.signal);
      const parsedStream = await parseStream(stream);
      const reader = parsedStream.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Update the last message with the new content
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.sender === 'bot') {
            lastMessage.text += value;
          }
          return newMessages;
        });
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error in chat:', error);
        // Update the last message with the error
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.sender === 'bot') {
            lastMessage.text = "I'm having trouble connecting to the AI service, but I can still help with previous trade analyses or general questions. Please try again or rephrase your question.";
          }
          return newMessages;
        });

        toast({ 
          title: 'Chat Error', 
          description: "Connection to AI service failed. Using fallback responses.", 
          variant: 'default' 
        });
      }
    } finally {
      setIsBotThinking(false);
      abortController.current = null;
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
            <div key={index} className={cn('flex items-start gap-3', 
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            )}>
              {msg.sender === 'bot' && (
                <div className="p-2 bg-brand-gray-200 rounded-full flex-shrink-0 self-end">
                  <Bot className="w-5 h-5 text-brand-green" />
                </div>
              )}
              <div className={cn('rounded-lg px-4 py-2 text-white max-w-[80%]', 
                msg.sender === 'user' ? 'bg-brand-green/20' : 'bg-brand-gray-200'
              )}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="User upload" className="rounded-md mb-2 max-w-full h-auto" />
                )}
                {msg.text && (
                  <div className="prose prose-sm prose-invert max-w-none [&_a]:text-brand-green [&_a:hover]:underline">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>
                )}
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
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
          accept="image/*" 
          disabled={isUploading} 
        />
        <Button 
          type="button" 
          size="icon" 
          variant="ghost" 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isUploading || isBotThinking}
        >
          {isUploading ? 
            <Loader2 className="w-5 h-5 animate-spin" /> : 
            <Paperclip className="w-5 h-5 text-gray-400" />
          }
        </Button>
        <Button 
          type="submit" 
          size="icon" 
          className="bg-brand-green hover:bg-brand-green/80 flex-shrink-0" 
          disabled={isUploading || isBotThinking}
        >
          <Send className="w-5 h-5 text-black" />
        </Button>
      </form>
    </div>
  );
};

export default GaphyBot;
