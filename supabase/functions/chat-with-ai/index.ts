
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY_ID = 'GEMINI_API_KEY'

interface GeminiMessage {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

Deno.serve(async (req) => {
  // This is needed for browser clients to call the function
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()

    if (!messages) {
      throw new Error('No messages provided.')
    }

    // Create a Supabase client with SERVICE_ROLE_KEY to bypass RLS
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get the Gemini API key from the app_config table
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`

    // Format messages for the Gemini API
    const geminiMessages: GeminiMessage[] = messages.map((msg: { sender: string; text: string }) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }))

    // Add a system prompt to give the AI its persona
    const contents = [
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

    // Call the Gemini API
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Gemini API error:', errorBody)
      throw new Error(`Gemini API request failed: ${errorBody}`)
    }

    const geminiData = await res.json()
    const botResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to respond to that. Please try rephrasing."

    return new Response(JSON.stringify({ reply: botResponseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

