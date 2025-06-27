import { parseStream } from './messageParser';
import { makeOpenRouterRequest } from './openrouterProvider';
import { makeGeminiRequest } from './geminiProvider';
import { makeGroqRequest } from './groqProvider';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

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

interface APIOptions {
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

async function makeAPIRequest(
  messages: Message[],
  signal?: AbortSignal,
  options: APIOptions = {},
  providerName: string = 'OpenRouter'
): Promise<Response> {
  if (!messages.length || !messages.every(m => m.role && m.content)) {
    throw new Error('Invalid message format.');
  }

  const providers = [
    { name: 'OpenRouter', request: makeOpenRouterRequest },
    { name: 'Gemini', request: makeGeminiRequest },
    { name: 'Groq', request: makeGroqRequest }
  ];

  const selectedProvider = providers.find(p => p.name === providerName);
  if (!selectedProvider) {
    throw new Error(`Invalid provider name: ${providerName}`);
  }

  try {
    console.log(`Attempting to connect with ${selectedProvider.name} provider as per user selection.`);
    const response = await selectedProvider.request(messages, signal, options);
    if (response.ok) {
      console.log(`Successfully connected with ${selectedProvider.name} provider.`);
      return response;
    }
    throw new Error(`Failed with ${selectedProvider.name} provider: ${response.status}`);
  } catch (error: any) {
    console.error(`Error with ${selectedProvider.name} provider:`, error.message);
    throw error;
  }
}

export async function chatWithAI(
  messages: Message[],
  signal?: AbortSignal,
  providerName: string = 'OpenRouter'
): Promise<ReadableStream<Uint8Array>> {
  const validMessages = messages.filter(m => m.content?.trim());
  const response = await makeAPIRequest(validMessages, signal, {
    stream: true,
    temperature: 0.7,
    max_tokens: 4000
  }, providerName);

  if (!response.body) {
    throw new Error('Response body is null');
  }

  return response.body;
}

export async function analyzeTradeIdea(content: string, providerName: string = 'OpenRouter'): Promise<TradeData | null> {
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
  }, providerName);

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
export async function classifyIntent(prompt: string, providerName: string = 'OpenRouter'): Promise<string> {
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
  }, providerName);

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
