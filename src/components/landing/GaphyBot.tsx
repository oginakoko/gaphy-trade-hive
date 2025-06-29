import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, MessageCircle, X, Paperclip, Loader2, Send, Trash2, Copy, ArrowDown } from 'lucide-react';
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
import { Card } from '@/components/ui/card';
import { useMediaQuery } from 'react-responsive';
import { useProfile } from '@/hooks/useProfile';
import { fetchDataForAI, summarizeTradeIdeas } from '@/lib/supabaseDataFetch';
import { getUserCount } from '@/lib/supabaseDataLanding';
import { AIProviderSelector } from '@/components/shared/AIProviderSelector';

type Message = {
  sender: 'user' | 'bot';
  text: string;
  imageUrl?: string;
  tradeData?: TradeData | null;
};

type GaphyBotProps = {
  onClose: () => void;
};

const getInitialMessage = (username: string | undefined, isAdmin: boolean): Message => {
  const greeting = username ? `Hi ${username}!` : "Hi!";
  const roleText = isAdmin ? "As an admin, I can provide access to all trade ideas and app data." : "I can help with trading analysis or access to your trade ideas.";
  return { 
    sender: 'bot', 
    text: `${greeting} I'm AlphaFinder, your AI assistant. ${roleText} What would you like to talk about?`
  };
};

// Smart system prompt creation based on user intent
const createSystemPrompt = (userMessage: string, profile: any, contextObj: any) => {
  // Check if user wants casual conversation
  const casualIndicators = ['talk', 'chat', 'hi', 'hello', 'hey', 'how are you', 'whats up', 'conversation', 'just chat', 'lets talk'];
  const isCasualRequest = casualIndicators.some(indicator => 
    userMessage.toLowerCase().includes(indicator.toLowerCase())
  );

  // Check if user is asking about trading/data specifically
  const tradingIndicators = ['trade', 'analyze', 'risk', 'reward', 'entry', 'setup', 'ideas', 'breakdown', 'trading', 'market', 'stock', 'forex', 'crypto'];
  const dataIndicators = ['ads', 'users', 'servers', 'data', 'show me', 'list', 'find', 'search', 'get me'];
  const isTradingRequest = tradingIndicators.some(indicator => 
    userMessage.toLowerCase().includes(indicator.toLowerCase())
  );
  const isDataRequest = dataIndicators.some(indicator => 
    userMessage.toLowerCase().includes(indicator.toLowerCase())
  );

  // Base context about available data
  const hasTradeIdeas = contextObj.tradeIdeas && contextObj.tradeIdeas.length > 0;
  const hasOtherData = contextObj.ads || contextObj.users || contextObj.servers;

  if (isCasualRequest && !isTradingRequest && !isDataRequest) {
    // User wants casual conversation
    return `You are AlphaFinder, a friendly AI assistant for Gaphy Trade Hive. You can have normal conversations about anything and also help with trading when asked. Be natural, conversational, and engaging. Don't mention trading unless the user brings it up. Keep responses casual and human-like.`;
  }

  if (profile?.is_admin && (isDataRequest || hasOtherData)) {
    // Admin asking for data or data is available
    const tradeIdeasSummary = hasTradeIdeas ? summarizeTradeIdeas(contextObj.tradeIdeas) : 'No trade ideas available.';
    const serversSummary = contextObj.servers?.length > 0 ? `Servers: ${contextObj.servers.length} available.` : 'No servers available.';
    const usersSummary = contextObj.users?.length > 0 ? `Users: ${contextObj.users.length} available.` : 'No users available.';
    const adsSummary = contextObj.ads?.length > 0 ? `Ads: ${contextObj.ads.length} available.` : 'No ads available.';
    const affiliateLinksSummary = contextObj.affiliateLinks?.length > 0 ? `Affiliate Links: ${contextObj.affiliateLinks.length} available.` : 'No affiliate links available.';

    return `You are AlphaFinder, the AI assistant for Gaphy Trade Hive.

You have access to the following data from the Gaphy Trade Hive platform:

TRADE IDEAS (${contextObj.tradeIdeas?.length || 0} available):
${tradeIdeasSummary}

${serversSummary}
${usersSummary}
${adsSummary}
${affiliateLinksSummary}

INSTRUCTIONS:
- Use this data to answer questions about the platform
- Be helpful and provide relevant information when asked
- For casual conversation, be natural and friendly
- Always give accurate information based on the data provided
- If asked about specific trades, users, ads, etc., refer to this data`;
  }

  if (isTradingRequest || hasTradeIdeas) {
    // User asking about trading or we have trade data
    const tradeIdeasSummary = hasTradeIdeas ? summarizeTradeIdeas(contextObj.tradeIdeas) : 'No trade ideas available.';
    return `You are AlphaFinder, a trading assistant for Gaphy Trade Hive. 

You have access to these trade ideas from the platform:
${tradeIdeasSummary}

INSTRUCTIONS:
- Help analyze these trade ideas when asked
- Provide insights on risk/reward, entry points, setups
- Reference specific trades from the data when relevant
- For casual conversation, be natural and friendly
- Always base trading advice on the actual trade data provided
- If no specific trade data matches the question, be honest about limitations`;
  }

  // Default: provide context but don't force it
  return `You are AlphaFinder, a friendly AI assistant for Gaphy Trade Hive. 

${hasTradeIdeas ? `You have access to ${contextObj.tradeIdeas.length} trade ideas from the platform.` : ''}
${hasOtherData ? 'You also have access to platform data including servers, users, and ads.' : ''}

Be natural, conversational, and helpful. Use the available data when relevant to answer questions, but don't force it into every conversation. Respond naturally to what the user is asking.`;
};

const GaphyBot = ({ onClose }: GaphyBotProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('OpenRouter');
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const scrollViewport = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortController = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // Initialize messages and provider based on user profile and local storage
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem('gaphybot-messages');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else if (profile) {
        setMessages([getInitialMessage(profile.username, profile.is_admin || false)]);
      } else {
        setMessages([getInitialMessage(undefined, false)]);
      }
      const storedProvider = localStorage.getItem('selectedAIProvider');
      if (storedProvider) {
        setSelectedProvider(storedProvider);
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      setMessages([getInitialMessage(undefined, false)]);
    }
  }, [profile]);

  // Save messages and auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('gaphybot-messages', JSON.stringify(messages));
    }
    // Auto-scroll to the bottom when messages change (initial load, new message)
    scrollToBottom();
  }, [messages]);

  // Auto-scroll on every bot message update (streaming)
  useEffect(() => {
    // Only auto-scroll if user is near the bottom (within 100px)
    if (scrollAreaRef.current) {
      const el = scrollAreaRef.current;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages[messages.length - 1]?.text]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Cancel any existing streams
    if (abortController.current) {
      abortController.current.abort();
    }

    const userMessage: Message = { sender: 'user', text: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    
    // Store the input before clearing it
    const userInput = input;
    setInput('');
    setIsBotThinking(true);

    // Classify intent and handle data fetching directly for specific data requests
    let contextObj: any = {};
    let botResponse: string | null = null;
    try {
      if (user) {
        const isAdmin = profile?.is_admin || false;
        const fetchedData = await fetchDataForAI(userInput, user.id, isAdmin);
        if (fetchedData.type === 'user_trade_ideas') {
          // Directly handle user trade ideas display to provide specific details
          const summary = summarizeTradeIdeas(fetchedData.data);
          botResponse = `Here are your trade ideas:\n\n${summary}\n\nIs there a specific trade idea you'd like more details on?`;
          setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
          setIsBotThinking(false);
          return; // Exit early, no need to send to AI
    } else if (fetchedData.type === 'all_trade_ideas') {
      // Directly handle admin data display to avoid token overload
      const summary = summarizeTradeIdeas(fetchedData.data);
      try {
        const userCount = await getUserCount();
        botResponse = `Here are the trade ideas I found for admin access:\n\n${summary}\n\nCurrent number of users in the app: ${userCount}\n\nIs there anything specific you'd like to know about these trade ideas or other app data?`;
      } catch (error) {
        console.error('Error fetching user count:', error);
        botResponse = `Here are the trade ideas I found for admin access:\n\n${summary}\n\nI couldn't fetch the current number of users due to an error.\n\nIs there anything specific you'd like to know about these trade ideas or other app data?`;
      }
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
      setIsBotThinking(false);
      return; // Exit early, no need to send to AI
    } else {
      contextObj = { tradeIdeas: [] };
        }
      } else {
        contextObj = { tradeIdeas: [] };
      }
    } catch (err) {
      console.error('Error fetching context:', err);
      contextObj = { tradeIdeas: [] };
    }

    // Create smart system prompt based on user intent
    const systemPrompt = createSystemPrompt(userInput, profile, contextObj);

    await sendToAI(currentMessages, systemPrompt);
  };

  // Helper function to send messages to the AI
  const sendToAI = async (currentMessages: Message[], systemPrompt: string) => {
    setIsBotThinking(true);
    // Add empty bot message for streaming
    setMessages(prev => [...prev, { sender: 'bot', text: '' }]);

    try {
      abortController.current = new AbortController();

      const chatMessages = [
        {
          role: 'system' as const,
          content: systemPrompt
        },
        // Include previous messages for conversation context (last 10 to avoid token limits)
        ...currentMessages.slice(-10).map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: m.text
        }))
      ];

      let streamedContent = '';
      try {
        const stream = await chatWithAI(chatMessages, abortController.current.signal, selectedProvider);
        const parsedStream = await parseStream(stream);
        const reader = parsedStream.getReader();
        const timeoutMs = 30000; // 30 seconds timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
        });

        while (true) {
          try {
            const readPromise = reader.read();
            const result = await Promise.race([readPromise, timeoutPromise]);
            if (result.done) break;
            streamedContent += result.value;
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage.sender === 'bot') {
                return [...prev.slice(0, -1), { ...lastMessage, text: streamedContent }];
              }
              return prev;
            });
            await new Promise(res => setTimeout(res, 40));
          } catch (error: any) {
            if (error.message === 'Request timed out') {
              throw error;
            }
            break; // Handle other read errors by breaking the loop
          }
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
        } else if (error.message === 'Request timed out') {
          console.error('AI request timed out:', error);
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.sender === 'bot') {
              return [...prev.slice(0, -1), { ...lastMessage, text: streamedContent + '\n\n*(Response timed out. Please try again.)*' }];
            }
            return prev;
          });
          toast({
            title: 'AI Timeout',
            description: 'The AI took too long to respond. Please try again.',
            variant: 'destructive',
          });
        } else {
          console.error('Error streaming message:', error);
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.sender === 'bot') {
              return [...prev.slice(0, -1), { ...lastMessage, text: streamedContent + '\n\n*(Error receiving response)*' }];
            }
            return prev;
          });
          toast({
            title: 'AI Error',
            description: 'Failed to get response from AI service.',
            variant: 'destructive',
          });
        }
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
        .from('bot-uploads')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('bot-uploads')
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      const userMessage: Message = { sender: 'user', text: `Uploaded image: ${file.name}`, imageUrl };
      setMessages(prev => [...prev, userMessage]);

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Failed',
        description: 'Could not upload the file.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearChat = () => {
    setMessages([getInitialMessage(profile?.username, profile?.is_admin || false)]);
    localStorage.removeItem('gaphybot-messages');
  };

  // Function to manually scroll to the bottom
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // Desktop: bottom-right, Mobile: full-screen
  return (
    <div className={cn(
      isMobile
        ? 'fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4'
        : 'fixed bottom-6 right-6 z-50 flex items-end justify-end p-0 sm:p-4 pointer-events-none',
    )}>
      <div className={cn(
        'pointer-events-auto',
        isMobile
          ? 'w-full max-w-md sm:max-w-lg h-full sm:h-auto flex flex-col'
          : 'w-full max-w-md sm:max-w-lg h-[80vh] flex flex-col shadow-2xl rounded-2xl border border-gray-700 bg-gray-900'
      )}>
        <Card className="flex-1 flex flex-col bg-gray-900 border border-gray-700 shadow-lg rounded-none sm:rounded-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-brand-green" />
              <span className="font-bold text-lg text-white">AlphaFinder AI</span>
            </div>
            <div className="flex items-center gap-2">
              <AIProviderSelector onProviderChange={setSelectedProvider} />
              {!isMobile && messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={scrollToBottom}
                  className="text-gray-400 hover:text-white"
                  aria-label="Scroll to bottom"
                >
                  <ArrowDown className="h-5 w-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleClearChat} className="text-gray-400 hover:text-red-400">
                <Trash2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* SCROLLABLE CHAT AREA */}
          <div
            ref={scrollAreaRef}
            className={cn(
              'flex-1 overflow-y-auto px-2 py-4 sm:px-4',
              isMobile ? '' : 'max-h-[500px]'
            )}
            tabIndex={0}
            aria-label="Chat messages"
          >
            <div className="space-y-4" ref={scrollViewport}>
              {messages.map((message, idx) => (
                <div key={idx} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}> 
                  <div className={`rounded-lg px-4 py-2 max-w-[80vw] sm:max-w-[70%] ${message.sender === 'user' ? 'bg-brand-green text-black' : 'bg-gray-800 text-white'} relative group`}> 
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                    {message.sender === 'bot' && message.text && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 text-gray-400 hover:text-white"
                        onClick={() => navigator.clipboard.writeText(message.text)}
                        aria-label="Copy message"
                      >
                        <Copy size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* INPUT FORM */}
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
              placeholder={isBotThinking ? 'Thinking...' : 'Message AlphaFinder...'}
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-w-0"
              disabled={isBotThinking || isUploading}
            />
            {isBotThinking ? (
              <Button type="button" onClick={() => {
                if (abortController.current) {
                  abortController.current.abort();
                }
              }} className="bg-red-500 hover:bg-red-600">
                <X className="h-5 w-5" />
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim() || isUploading} className="bg-brand-green hover:bg-brand-green/90">
                <Send className="h-5 w-5" />
              </Button>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};

export default GaphyBot;
