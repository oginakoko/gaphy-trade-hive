import { parseStream } from './messageParser';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_MODELS_URL = 'https://openrouter.ai/api/v1/models';

// R1 is one of the most powerful open source models that has a free tier
const DEFAULT_MODEL = 'mistralai/mixtral-8x7b-instruct';

export interface TradeData {
  asset: string;
  direction: 'Long' | 'Short';
  entry_price: number | null;
  target_price: number | null;
  stop_loss: number | null;
  risk_reward: number | null;
  sentiment?: 'Bullish' | 'Bearish' | 'Neutral';
  key_points?: string[];
  status: 'open' | 'closed' | 'cancelled';
}

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

interface APIRequestBody {
  model: string;
  messages: Message[];
  temperature?: number;
  stream?: boolean;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  top_p?: number;
  top_k?: number;
}

interface APIOptions {
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

let availableModels: OpenRouterModel[] = [];

async function fetchAvailableModels(): Promise<OpenRouterModel[]> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured');
  }

  try {
    const response = await fetch(API_MODELS_URL, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://gaphyhive.com',
        'X-Title': 'GaphyHive'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    availableModels = data.data || [];
    return availableModels;
  } catch (error) {
    console.error('Failed to fetch available models:', error);
    // Return empty array but don't throw - we'll use the default model
    return [];
  }
}

// Initialize models list
fetchAvailableModels().catch(console.error);

async function makeAPIRequest(
  messages: Message[],
  signal?: AbortSignal,
  { stream = false, temperature = 0.7, max_tokens = 4000 }: APIOptions = {}
): Promise<Response> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured');
  }

  // Validate message format
  if (!messages.length || !messages.every(m => m.role && m.content && typeof m.content === 'string')) {
    throw new Error('Invalid message format. Each message must have a role and content.');
  }

  // Find a suitable model
  const model = availableModels.find(m => m.id === DEFAULT_MODEL) ? DEFAULT_MODEL : 'mistralai/mixtral-8x7b-instruct';

  const requestBody: APIRequestBody = {
    model,
    messages,
    temperature,
    stream,
    max_tokens,
    frequency_penalty: 0,
    presence_penalty: 0,
    top_p: 1,
    top_k: 40
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://gaphyhive.com',
        'X-Title': 'GaphyHive'
      },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // If we can't parse the error JSON, use the default message
      }
      throw new Error(errorMessage);
    }

    return response;
  } catch (error: any) {
    // Rethrow abort errors as is
    if (error.name === 'AbortError') {
      throw error;
    }

    // Add more context to the error message
    const message = error.message || 'Unknown error occurred';
    throw new Error(`Failed to connect to AI service: ${message}. Please try again later.`);
  }
}

export async function chatWithAI(
  messages: Message[],
  signal?: AbortSignal
): Promise<ReadableStream<Uint8Array>> {
  // Filter out any empty or invalid messages
  const validMessages = messages.filter(m => m.content?.trim());

  const response = await makeAPIRequest(validMessages, signal, { 
    stream: true, 
    temperature: 0.7, 
    max_tokens: 4000 
  });

  if (!response.body) {
    throw new Error('Response body is null');
  }

  return response.body;
}

export async function analyzeTradeIdea(content: string): Promise<TradeData | null> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a trading analysis assistant. Extract ONLY EXPLICIT trade information from the given content.
Focus on identifying concrete numbers and clear statements:
- Asset/Instrument name (e.g., "BTCUSD", "ETH", "Gold")
- Clear direction statements ("Going long", "Short position", etc.)
- Specific entry prices (e.g., "Entry at 50000", "Entered at 1800")
- Specific target prices (e.g., "Target: 55000", "Take profit at 2000")
- Specific stop loss levels (e.g., "Stop loss at 48000", "SL: 1750")

Only return data if you find EXPLICIT numerical values for either entry price or target price.
If no explicit entry/target prices are found, return null.
Ignore general analysis or vague statements.

Return format (JSON):
{
  "asset": string,      // Required if found
  "direction": string,  // Required if found ("Long" or "Short")
  "entry_price": number | null,  // Optional
  "target_price": number | null, // Optional
  "stop_loss": number | null,    // Optional
  "risk_reward": number | null,   // Optional, calculate if have both target and stop
  "sentiment": string | null, // Optional
  "key_points": string[] | null // Optional
}`
    },
    {
      role: 'user',
      content: content.trim()
    }
  ];

  try {
    const response = await makeAPIRequest(messages, undefined, { 
      stream: false, 
      temperature: 0.3, 
      max_tokens: 500 
    });

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected API response format:', data);
      return null;
    }

    const result = data.choices[0].message.content;
    console.log('Raw AI response:', result); // Log raw response for debugging

    try {
      // Attempt to extract JSON from the response
      const jsonMatch = result.match(/```json\\n([\\s\\S]*?)\\n```/);
      let jsonString = result;

      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
      } else {
        // Fallback to finding the first { and last }
        const firstCurly = result.indexOf('{');
        const lastCurly = result.lastIndexOf('}');
        if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
          jsonString = result.substring(firstCurly, lastCurly + 1);
        }
      }

      // Sanitize: replace numbers ending with a period (e.g., 38.) with 38.0
      jsonString = jsonString.replace(/(\d+)\.(?=\s*[\,\}])/g, '$1.0');

      const parsedData = JSON.parse(jsonString);

      if (parsedData && parsedData.asset && parsedData.direction) {
        // Only proceed if we have either entry price or target price
        if (parsedData.entry_price === null && parsedData.target_price === null) {
          console.log('No explicit entry or target price found.');
          return null;
        }

        // Calculate risk/reward if we have both target and stop
        if (parsedData.target_price !== null && parsedData.stop_loss !== null && parsedData.entry_price !== null) {
          const direction = parsedData.direction.toLowerCase();
          const risk = Math.abs(parsedData.entry_price - parsedData.stop_loss);
          const reward = Math.abs(parsedData.target_price - parsedData.entry_price);

          if (risk === 0) {
             parsedData.risk_reward = null; // Avoid division by zero
          } else {
            parsedData.risk_reward = direction === 'long' ? 
              reward / risk : 
              risk / reward;
          }
        }

        return {
          ...parsedData,
          status: 'open'
        };
      }
    } catch (e) {
      console.error('Failed to parse trade data:', e);
      console.log('Problematic AI response:', result); // Log the raw response that failed parsing
    }
    // Return null instead of throwing so the chat can continue
    return null;
  } catch (error) {
    console.error('Error analyzing trade idea:', error);
    // Return null instead of throwing so the chat can continue
    return null;
  }

  return null;
}
