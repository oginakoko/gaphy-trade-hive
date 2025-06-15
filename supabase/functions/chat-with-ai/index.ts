
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY_ID = 'GEMINI_API_KEY'

interface GeminiMessage {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

const mergeConsecutiveMessages = (messages: GeminiMessage[]): GeminiMessage[] => {
  if (!messages.length) {
    return []
  }
  
  const merged: GeminiMessage[] = []
  let currentMessage: GeminiMessage = {
    role: messages[0].role,
    parts: [{ text: messages[0].parts[0].text }],
  }

  for (let i = 1; i < messages.length; i++) {
    const message = messages[i]
    if (message.role === currentMessage.role) {
      // Merge text of consecutive messages from the same role
      currentMessage.parts[0].text += `\n${message.parts[0].text}`
    } else {
      merged.push(currentMessage)
      currentMessage = {
        role: message.role,
        parts: [{ text: message.parts[0].text }],
      }
    }
  }
  merged.push(currentMessage)
  return merged
}

// Always wrap the main handler in a try/catch
Deno.serve(async (req) => {
  try {
    console.log('=== [chat-with-ai] Edge Function Start ===')
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
      return new Response(JSON.stringify({
        error: 'Invalid JSON body',
        type: 'bad_request'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // Messages received?
    const { messages } = requestBody
    if (!messages || !Array.isArray(messages)) {
      console.error('[chat-with-ai] No valid "messages" array received')
      return new Response(JSON.stringify({
        error: 'Missing or invalid messages array in body',
        type: 'bad_request'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // ENV validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[chat-with-ai] Supabase env missing', { supabaseUrl, supabaseServiceKey })
      return new Response(JSON.stringify({
        error: 'Function configuration error: missing env vars',
        type: 'server_error'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    // Supabase Client
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch Gemini API key from db
    let apiKeyData, apiKeyError;
    try {
      const { data, error } = await serviceClient
        .from('app_config')
        .select('value')
        .eq('key', GEMINI_API_KEY_ID)
        .single()
      apiKeyData = data
      apiKeyError = error
    } catch (err) {
      apiKeyError = err
    }
    if (apiKeyError || !apiKeyData?.value) {
      console.error('[chat-with-ai] Failed to get Gemini key:', apiKeyError, apiKeyData)
      return new Response(JSON.stringify({
        error: 'AI service not configured. Ask admin to add Gemini API key.',
        type: 'not_configured'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }
    const geminiApiKey = apiKeyData.value

    // Prepare for Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`

    // Format messages
    const geminiMessages: GeminiMessage[] = messages.map((msg: { sender: string; text: string }) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }))

    // Add initial system/context prompts
    const initialContents = [
      {
        role: 'user',
        parts: [{ text: "You are AlphaFinder, an expert trading assistant for the GaphyHive platform. Your goal is to provide insightful, concise, and helpful analysis on financial markets and trade ideas. Your persona is professional, but friendly and approachable. Keep your answers short and to the point. Do not provide financial advice. ALWAYS include a disclaimer at the end of your response that your analysis is for educational and informational purposes only and does not constitute financial advice. The user is asking you a question, here is the conversation history:" }],
      },
      {
        role: 'model',
        parts: [{text: "Understood. I'm ready to assist with trading analysis and insights."}]
      },
      ...geminiMessages,
    ]
    const contents = mergeConsecutiveMessages(initialContents)
    console.log('[chat-with-ai] Sending to Gemini. Count:', contents.length)

    // Call Gemini API
    let geminiResponse: Response
    try {
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      })
    } catch (error) {
      console.error('[chat-with-ai] Error calling Gemini:', error)
      return new Response(JSON.stringify({
        error: 'Could not reach AI service (Gemini): ' + (error?.message || error),
        type: 'upstream_error'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 })
    }

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('[chat-with-ai] Gemini API error', geminiResponse.status, errText)
      return new Response(JSON.stringify({
        error: 'Gemini API returned error: ' + errText,
        type: 'ai_error'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 })
    }

    // Parse result
    let geminiData
    try {
      geminiData = await geminiResponse.json()
    } catch (error) {
      console.error('[chat-with-ai] Failed to parse Gemini JSON:', error)
      return new Response(JSON.stringify({
        error: 'AI service response was malformed',
        type: 'ai_error'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 })
    }

    const botResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
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
      type: 'server_error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
