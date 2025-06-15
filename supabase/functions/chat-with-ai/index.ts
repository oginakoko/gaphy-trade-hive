
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
  // Manual deep copy to avoid potential structuredClone issues in Deno runtime
  let lastMessage: GeminiMessage = {
    role: messages[0].role,
    parts: [{ text: messages[0].parts[0].text }],
  }

  for (let i = 1; i < messages.length; i++) {
    const currentMessage = messages[i]
    if (currentMessage.role === lastMessage.role) {
      // Merge text of consecutive messages from the same role
      lastMessage.parts[0].text += `\n${currentMessage.parts[0].text}`
    } else {
      merged.push(lastMessage)
      // Manual deep copy for the new message
      lastMessage = {
        role: currentMessage.role,
        parts: [{ text: currentMessage.parts[0].text }],
      }
    }
  }
  merged.push(lastMessage)
  return merged
}

Deno.serve(async (req) => {
  console.log('Edge Function called with method:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Parsing request body...')
    const { messages } = await req.json()

    if (!messages) {
      console.error('No messages provided in request')
      throw new Error('No messages provided.')
    }

    console.log('Messages received:', messages.length)

    // Create a Supabase client with SERVICE_ROLE_KEY to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Supabase configuration is missing')
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get the Gemini API key from the app_config table
    console.log('Fetching Gemini API key...')
    const { data: apiKeyData, error: apiKeyError } = await serviceClient
      .from('app_config')
      .select('value')
      .eq('key', GEMINI_API_KEY_ID)
      .single()

    if (apiKeyError || !apiKeyData?.value) {
      console.error('API Key fetch error:', apiKeyError)
      throw new Error('The Gemini API key is not configured in the application settings.')
    }

    const geminiApiKey = apiKeyData.value
    console.log('Gemini API key retrieved successfully')

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`

    // Format messages for the Gemini API
    const geminiMessages: GeminiMessage[] = messages.map((msg: { sender: string; text: string }) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }))

    // Add a system prompt to give the AI its persona
    const initialContents = [
      {
        role: 'user',
        parts: [{ text: "You are AlphaFinder, an expert trading assistant for the GaphyHive platform. Your goal is to provide insightful, concise, and helpful analysis on financial markets and trade ideas. Your persona is professional, but friendly and approachable. Keep your answers short and to the point. Do not provide financial advice. ALWAYS include a disclaimer at the end of your response that your analysis is for educational and informational purposes only and does not constitute financial advice. The user is asking you a question, here is the conversation history:" }],
      },
      {
        role: 'model',
        parts: [{text: "Understood. I'm ready to assist."}]
      },
      ...geminiMessages,
    ]
    
    const contents = mergeConsecutiveMessages(initialContents)
    console.log('Prepared contents for Gemini API, message count:', contents.length)

    // Call the Gemini API
    console.log('Calling Gemini API...')
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Gemini API error:', errorBody)
      throw new Error(`Gemini API request failed with status ${res.status}: ${errorBody}`)
    }

    const geminiData = await res.json()
    console.log('Gemini API response received')
    
    const botResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to respond to that. Please try rephrasing."

    console.log('Returning successful response')
    return new Response(JSON.stringify({ reply: botResponseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
