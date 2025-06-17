
import { corsHeaders } from '../_shared/cors.ts'

const OPENROUTER_API_KEY_SECRET = 'OPENROUTER_API_KEY'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

Deno.serve(async (req) => {
  try {
    console.log('=== [chat-with-ai] Edge Function Start (OpenRouter) ===')
    console.log('Request method:', req.method, 'URL:', req.url)

    // CORS preflight
    if (req.method === 'OPTIONS') {
      console.log('[chat-with-ai] OPTIONS preflight hit')
      return new Response('ok', { headers: corsHeaders })
    }

    // Try to parse body
    let requestBody: any
    try {
      requestBody = await req.json()
      if (!requestBody) throw new Error('Request body JSON is empty');
      console.log('[chat-with-ai] Parsed body:', JSON.stringify(requestBody))
    } catch (error) {
      console.error('[chat-with-ai] Failed parsing request body:', error)
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // Messages received?
    const { messages } = requestBody
    if (!messages || !Array.isArray(messages)) {
      console.error('[chat-with-ai] No valid "messages" array received')
      return new Response(JSON.stringify({ error: 'Missing or invalid messages array in body' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // Fetch OpenRouter API key from Supabase secrets
    const openRouterApiKey = Deno.env.get(OPENROUTER_API_KEY_SECRET)
    if (!openRouterApiKey) {
        console.error('[chat-with-ai] OpenRouter API key not found in environment variables.')
        return new Response(JSON.stringify({
            error: 'AI service not configured. Ask admin to add OpenRouter API key.',
            type: 'not_configured'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    // Prepare for OpenRouter API
    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions'
    
    // Format messages for OpenRouter
    const systemPrompt: ChatMessage = {
        role: 'system',
        content: "You are AlphaFinder, an expert trading assistant for the GaphyHive platform. Your goal is to provide insightful, concise, and helpful analysis on financial markets and trade ideas. Your persona is professional, but friendly and approachable. Keep your answers short and to the point. Do not provide financial advice. ALWAYS include a disclaimer at the end of your response that your analysis is for educational and informational purposes only and does not constitute financial advice."
    }

    const userMessages: ChatMessage[] = messages.map((msg: { sender: string; text: string }) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
    }))

    const finalMessages: ChatMessage[] = [systemPrompt, ...userMessages]
    console.log('[chat-with-ai] Sending to OpenRouter. Message count:', finalMessages.length)

    // Call OpenRouter API
    const siteUrl = req.headers.get('origin') || 'https://gaphyhive.lovable.dev'
    const response = await fetch(openRouterUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': siteUrl,
            'X-Title': 'GaphyHive',
        },
        body: JSON.stringify({
            model: 'mistralai/mistral-7b-instruct:free',
            messages: finalMessages,
        }),
    })

    if (!response.ok) {
        const errText = await response.text()
        console.error('[chat-with-ai] OpenRouter API error', response.status, errText)
        return new Response(JSON.stringify({ error: 'OpenRouter API returned an error: ' + errText }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 })
    }

    const data = await response.json()
    const botResponseText = data.choices?.[0]?.message?.content ||
       "I'm not sure how to respond. Please try rephrasing your question."

    return new Response(JSON.stringify({ reply: botResponseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // Catch all: *always* return JSON + CORS!
    console.error('[chat-with-ai] Handler crashed:', error)
    return new Response(JSON.stringify({
      error: (error && error.message) ? error.message : 'Internal server error',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
