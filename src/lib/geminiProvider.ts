interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || '') as string;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const DEFAULT_MODEL = 'gemini-pro';
const FALLBACK_MODELS_GEMINI = [
  'gemini-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite'
];

interface APIRequestBody {
  contents: Array<{
    role: string;
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  stream?: boolean;
}

interface APIOptions {
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export async function makeGeminiRequest(
  messages: Message[],
  signal?: AbortSignal,
  options: APIOptions = {}
): Promise<Response> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('YOUR_')) {
    throw new Error(
      'Gemini API key is not configured. Please set your API key in the .env file as VITE_GEMINI_API_KEY.'
    );
  }

  if (!messages.length || !messages.every(m => m.role && m.content)) {
    throw new Error('Invalid message format.');
  }

  let lastError: any = null;
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds delay between retries

  for (const tryModel of FALLBACK_MODELS_GEMINI || [DEFAULT_MODEL]) {
    let currentModel = tryModel;
    console.log(`Trying model ${currentModel} with Gemini API key.`);

    const requestBody: APIRequestBody = {
      contents: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.max_tokens || 4000
      },
      stream: options.stream || false
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt} of ${maxRetries} for model ${currentModel} with Gemini API key.`);
        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal
        });

        if (response.ok) {
          console.log(`Successfully connected with model ${currentModel} using Gemini API key on attempt ${attempt}.`);
          return response;
        }

        let errorMessage = `HTTP error with model ${currentModel} using Gemini API key on attempt ${attempt}! status: ${response.status}`;
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
          console.log(`Retrying after error on attempt ${attempt} for model ${currentModel} with Gemini API key.`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }

  throw new Error(`Failed to connect to Gemini service after trying all fallbacks: ${lastError?.message || 'Unknown error'}. Please verify that your API key is correct and active.`);
}
