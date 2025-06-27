import { parseStream } from './messageParser';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const OPENROUTER_API_KEY = (import.meta.env.VITE_OPENROUTER_API_KEY || '') as string;
const FALLBACK_OPENROUTER_API_KEY = (import.meta.env.VITE_OPENROUTER_FALLBACK_API_KEY || '') as string;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_MODELS_URL = 'https://openrouter.ai/api/v1/models';

const DEFAULT_MODEL = 'meta-llama/llama-4-maverick:free';
const FALLBACK_MODELS_OPENROUTER = [
  'meta-llama/llama-4-maverick:free',
  'meta-llama/llama-4-scout:free',
  'openchat/openchat-3.5:free'
];

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

export async function makeOpenRouterRequest(
  messages: Message[],
  signal?: AbortSignal,
  options: APIOptions = {}
): Promise<Response> {
  const apiKeys = [
    { key: OPENROUTER_API_KEY, source: 'primary' },
    { key: FALLBACK_OPENROUTER_API_KEY, source: 'fallback' }
  ].filter(k => k.key && !k.key.includes('YOUR_'));

  if (apiKeys.length === 0) {
    throw new Error(
      'OpenRouter API key is not configured. Please set your API keys in the .env file.'
    );
  }

  if (!messages.length || !messages.every(m => m.role && m.content)) {
    throw new Error('Invalid message format.');
  }

  let lastError: any = null;
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds delay between retries

  for (const { key, source } of apiKeys) {
    for (const tryModel of FALLBACK_MODELS_OPENROUTER || [DEFAULT_MODEL]) {
      let currentModel = tryModel;
      console.log(`Trying model ${currentModel} with ${source} OpenRouter API key.`);
      
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

      const requestBody: APIRequestBody = {
        model: currentModel,
        messages,
        ...options
      };

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt} of ${maxRetries} for model ${currentModel} with ${source} OpenRouter API key.`);
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
            console.log(`Successfully connected with model ${currentModel} using ${source} OpenRouter API key on attempt ${attempt}.`);
            return response;
          }

          let errorMessage = `HTTP error with model ${currentModel} using ${source} OpenRouter API key on attempt ${attempt}! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorMessage;
          } catch {}

          console.error(errorMessage);
          lastError = new Error(errorMessage);

          if (response.status !== 429 && response.status !== 402 && !errorMessage.toLowerCase().includes('provider')) {
            throw lastError;
          }

          if (attempt < maxRetries) {
            console.log(`Retrying after delay due to retryable error...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            throw error;
          }
          lastError = error;
          if (attempt < maxRetries) {
            console.log(`Retrying after error on attempt ${attempt} for model ${currentModel} with ${source} OpenRouter API key.`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
    }
  }

  throw new Error(`Failed to connect to OpenRouter service after trying all fallbacks: ${lastError?.message || 'Unknown error'}. Please verify that your API keys are correct and active with OpenRouter.`);
}
