interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY || '') as string;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_MODEL = 'llama3-8b-8192';
const FALLBACK_MODELS_GROQ = [
  'llama3-8b-8192',
  'llama3-70b-8192',
  'mixtral-8x7b-32768'
];

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

export async function makeGroqRequest(
  messages: Message[],
  signal?: AbortSignal,
  options: APIOptions = {}
): Promise<Response> {
  if (!GROQ_API_KEY || GROQ_API_KEY.includes('YOUR_')) {
    throw new Error(
      'Groq API key is not configured. Please set your API key in the .env file as VITE_GROQ_API_KEY.'
    );
  }

  if (!messages.length || !messages.every(m => m.role && m.content)) {
    throw new Error('Invalid message format.');
  }

  let lastError: any = null;
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds delay between retries

  for (const tryModel of FALLBACK_MODELS_GROQ || [DEFAULT_MODEL]) {
    let currentModel = tryModel;
    console.log(`Trying model ${currentModel} with Groq API key.`);

    const requestBody: APIRequestBody = {
      model: currentModel,
      messages,
      ...options
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt} of ${maxRetries} for model ${currentModel} with Groq API key.`);
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify(requestBody),
          signal
        });

        if (response.ok) {
          console.log(`Successfully connected with model ${currentModel} using Groq API key on attempt ${attempt}.`);
          return response;
        }

        let errorMessage = `HTTP error with model ${currentModel} using Groq API key on attempt ${attempt}! status: ${response.status}`;
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
          console.log(`Retrying after error on attempt ${attempt} for model ${currentModel} with Groq API key.`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }

  throw new Error(`Failed to connect to Groq service after trying all fallbacks: ${lastError?.message || 'Unknown error'}. Please verify that your API key is correct and active.`);
}
