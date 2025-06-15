
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

Deno.serve(async (req) => {
  // Enhanced logging for debugging
  console.log(`[${new Date().toISOString()}] send-server-message invoked. Method: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request.');
    return new Response('ok', {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
      },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Edge Function: Missing Supabase environment variables.')
      return new Response(JSON.stringify({ error: 'Server is not configured correctly.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const body = await req.json()
    if (!body || !body.messageData) {
      return new Response(JSON.stringify({ error: 'Invalid request body, messageData is missing.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    console.log('Request body parsed successfully.');

    const { messageData } = body
    const { server_id, user_id, content, media_url, media_type, mentioned_users } = messageData

    // Create a Supabase client with the user's auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    )

    // 1. Insert the message
    const { data: newMessage, error: messageError } = await supabaseClient
      .from('server_messages')
      .insert({ server_id, user_id, content, media_url, media_type })
      .select('*, profiles(username, avatar_url)')
      .single()

    if (messageError) {
      console.error('Error inserting message:', messageError);
      throw messageError
    }
    if (!newMessage) {
      console.error('Failed to create message, insert returned no data.');
      throw new Error('Failed to create message.')
    }
    console.log('Message inserted successfully:', newMessage.id);

    // 2. Create notifications if there are mentions
    if (mentioned_users && mentioned_users.length > 0) {
      console.log(`Creating notifications for ${mentioned_users.length} mentioned users.`);
      const notifications = mentioned_users.map((mentionedId: string) => ({
        recipient_id: mentionedId,
        sender_id: user_id,
        type: 'mention' as const,
        reference_id: server_id, // Using server_id which is a UUID
        server_id: server_id,
      }))

      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert(notifications)
      
      if (notificationError) {
        // Log the error but don't fail the whole request as the message was sent.
        console.error('Failed to create notifications:', notificationError.message)
      } else {
        console.log('Notifications created successfully.');
      }
    }

    console.log('Returning successful response for message ID:', newMessage.id);
    return new Response(JSON.stringify({ data: newMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(`[ERROR] in send-server-message: ${error.message}`, { error });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
