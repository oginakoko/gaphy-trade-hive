import { parseStream } from './messageParser';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const OPENROUTER_API_KEY = (import.meta.env.VITE_OPENROUTER_API_KEY || '') as string;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_MODELS_URL = 'https://openrouter.ai/api/v1/models';

// R1 is one of the most powerful open source models that has a free tier
const DEFAULT_MODEL = 'meta-llama/llama-4-maverick:free';
const FALLBACK_MODELS_OPENROUTER = [
  'meta-llama/llama-4-maverick:free',
  'meta-llama/llama-4-scout:free',
  'openchat/openchat-3.5:free'
];
const FALLBACK_MODELS_GEMINI = [
  'google/gemini-pro',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite'
];

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
    console.warn('OpenRouter API key is not configured. Cannot fetch available models.');
    return [];
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
      console.error(`HTTP error fetching models! status: ${response.status}`);
      return [];
    }

    const data = await response.json();
    availableModels = data.data || [];
    return availableModels;
  } catch (error) {
    console.error('Failed to fetch available models:', error);
    return [];
  }
}

// Initialize models list
fetchAvailableModels().catch(console.error);

const FALLBACK_OPENROUTER_API_KEY = (import.meta.env.VITE_OPENROUTER_FALLBACK_API_KEY || '') as string;
const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '') as string;
const FALLBACK_MODEL = 'google/gemini-pro'; // Default Gemini model

export function setFallbackOpenRouterKey(key: string) {
  // This function might not be needed if keys are always from env
  // but keeping it for now if there's external logic that uses it.
  // For now, it won't directly affect the const above.
  console.warn('setFallbackOpenRouterKey called, but API keys are now loaded directly from environment variables.');
}

async function makeAPIRequest(
  messages: Message[],
  signal?: AbortSignal,
  options: APIOptions = {}
): Promise<Response> {
  const apiKeys = [
    { key: OPENROUTER_API_KEY, model: DEFAULT_MODEL, source: 'primary', models: FALLBACK_MODELS_OPENROUTER },
    { key: FALLBACK_OPENROUTER_API_KEY, model: DEFAULT_MODEL, source: 'fallback', models: FALLBACK_MODELS_OPENROUTER },
    { key: GEMINI_API_KEY, model: FALLBACK_MODEL, source: 'gemini', models: FALLBACK_MODELS_GEMINI }
  ].filter(k => k.key && !k.key.includes('YOUR_'));

  console.log("Available API Keys for makeAPIRequest:", apiKeys.map(k => ({ source: k.source, model: k.model, keyPresent: !!k.key, keyValue: k.key ? k.key.substring(0, 5) + '...' : 'undefined' })));

  if (apiKeys.length === 0) {
    throw new Error(
      'AI service API key is not configured. Please set your API keys in the .env file.'
    );
  }

  if (!messages.length || !messages.every(m => m.role && m.content)) {
    throw new Error('Invalid message format.');
  }

  let lastError: any = null;

  for (const { key, model, source, models } of apiKeys) {
    for (const tryModel of models || [model]) {
      let currentModel = tryModel;
      console.log(`Trying model ${currentModel} with ${source} API key. Request headers include Authorization: Bearer [key snippet: ${key ? key.substring(0, 5) + '...' : 'undefined'}].`);
      
      if (source === 'primary' || source === 'fallback') {
        const freeModels = availableModels.filter(m => parseFloat(m.pricing.prompt) === 0 && parseFloat(m.pricing.completion) === 0);
        if (!availableModels.find(m => m.id === currentModel)) {
          const foundFreeModel = FALLBACK_MODELS_OPENROUTER.find(id => freeModels.some(m => m.id === id));
          if (foundFreeModel) {
            currentModel = foundFreeModel;
          } else if (freeModels.length > 0) {
            currentModel = freeModels[0].id;
          } else {
            currentModel = FALLBACK_MODELS_OPENROUTER[0];
          }
        }
      }

      const requestBody: APIRequestBody = {
        model: currentModel,
        messages,
        ...options
      };

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': 'https://gaphyhive.com',
            'X-Title': 'GaphyHive'
          },
          body: JSON.stringify(requestBody),
          signal
        });

        if (response.ok) {
          console.log(`Successfully connected with model ${currentModel} using ${source} API key.`);
          return response;
        }

        let errorMessage = `HTTP error with model ${currentModel} using ${source} API key! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch {}

        lastError = new Error(errorMessage);
        console.error(errorMessage);

        if (response.status !== 429 && response.status !== 402 && !errorMessage.toLowerCase().includes('provider')) {
          throw lastError;
        }
        // If it's a retryable error, the loop will continue to the next model or key.
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error;
        }
        lastError = error;
      }
    }
  }

  throw new Error(`Failed to connect to AI service after trying all fallbacks: ${lastError?.message || 'Unknown error'}. Please verify that your API keys are correct and active with OpenRouter. Check your OpenRouter account for any restrictions or contact support for assistance.`);
}

export async function chatWithAI(
  messages: Message[],
  signal?: AbortSignal
): Promise<ReadableStream<Uint8Array>> {
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
}

/**
 * Classifies the intent of a user prompt to determine if it's about user's own content, admin full data, or something else.
 * @param prompt The user input to classify.
 * @returns Promise<string> The classified intent: 'user_content', 'admin_data', or 'other'.
 */
export async function classifyIntent(prompt: string): Promise<string> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an intent classification assistant. Your task is to analyze user prompts and classify them into one of three categories:
- 'user_content': If the user is asking about their own trade ideas or personal content (e.g., "my trade ideas", "show me my trades").
- 'admin_data': If the user is requesting access to all trade ideas or full app content, typically for admin purposes (e.g., "all trade ideas", "show me everything", "app content").
- 'other': If the prompt does not fit into the above categories or is unrelated to fetching data.

Respond with only one of these labels: 'user_content', 'admin_data', or 'other'. Do not provide explanations or additional text.`
    },
    {
      role: 'user',
      content: `Classify: "${prompt}"`
    }
  ];

  const response = await makeAPIRequest(messages, undefined, {
    stream: false,
    temperature: 0.0,
    max_tokens: 10
  });

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) {
    console.error('Unexpected API response format:', data);
    return 'other';
  }

  const result = data.choices[0].message.content.trim();
  if (result === 'user_content' || result === 'admin_data') {
    return result;
  }
  return 'other';
}

/**
 * Utility to decode a ReadableStream<Uint8Array> to string.
 * Handles OpenRouter's streaming JSON lines and extracts assistant content.
 */
export async function decodeAIStreamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const streamReader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let result = '';
  let buffer = '';
  while (true) {
    const { done, value } = await streamReader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.replace(/^data:/, '').trim();
        if (jsonStr === '[DONE]' || !jsonStr) continue;
        try {
          const data = JSON.parse(jsonStr);
          const content = data.choices?.[0]?.delta?.content;
          if (typeof content === 'string') {
            result += content;
          }
        } catch (e) {
          // Ignore JSON parse errors for non-data lines
        }
      }
    }
  }
  // Flush any remaining bytes (incomplete line)
  // Flush any remaining bytes (incomplete line)
  if (buffer.trim().startsWith('data:')) {
    const jsonStr = buffer.trim().replace(/^data:/, '').trim();
    if (jsonStr && jsonStr !== '[DONE]') {
      try {
        const data = JSON.parse(jsonStr);
        const content = data.choices?.[0]?.delta?.content;
        if (typeof content === 'string') {
          result += content;
        }
      } catch (e) {}
    }
  }
  return result;
}
