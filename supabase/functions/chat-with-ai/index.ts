
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

Deno.serve(async (req) => {
  console.log('=== Edge Function Start ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Reading request body...')
    let requestBody
    try {
      requestBody = await req.json()
    } catch (e) {
      console.error('Failed to parse JSON:', e)
      throw new Error('Invalid JSON in request body')
    }

    const { messages } = requestBody
    console.log('Request body parsed successfully')

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages:', messages)
      throw new Error('Messages must be an array')
    }

    console.log('Messages count:', messages.length)

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:')
    console.log('- SUPABASE_URL exists:', !!supabaseUrl)
    console.log('- SERVICE_ROLE_KEY exists:', !!supabaseServiceKey)
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables')
      throw new Error('Server configuration error: Missing environment variables')
    }

    // Create Supabase client
    console.log('Creating Supabase client...')
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get the Gemini API key
    console.log('Fetching API key from database...')
    const { data: apiKeyData, error: apiKeyError } = await serviceClient
      .from('app_config')
      .select('value')
      .eq('key', GEMINI_API_KEY_ID)
      .single()

    if (apiKeyError) {
      console.error('Database error:', apiKeyError)
      throw new Error('Failed to fetch API configuration')
    }

    if (!apiKeyData?.value) {
      console.error('API key not found in database')
      throw new Error('AI service is not configured. Please contact support.')
    }

    const geminiApiKey = apiKeyData.value
    console.log('API key retrieved successfully')

    // Prepare Gemini API request
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`

    // Format messages for Gemini
    const geminiMessages: GeminiMessage[] = messages.map((msg: { sender: string; text: string }) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }))

    // Add system prompt
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
    console.log('Prepared', contents.length, 'messages for Gemini')

    // Call Gemini API
    console.log('Making request to Gemini API...')
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contents }),
    })

    console.log('Gemini API response status:', geminiResponse.status)

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error response:', errorText)
      throw new Error(`AI service returned error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    console.log('Gemini API response received successfully')
    
    const botResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to respond to that. Please try rephrasing your question."

    console.log('Sending successful response')
    return new Response(JSON.stringify({ reply: botResponseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('=== Edge Function Error ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      type: 'server_error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
