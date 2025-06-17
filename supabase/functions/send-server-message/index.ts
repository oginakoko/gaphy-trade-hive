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

    // Remove mentioned_user_ids from the insert payload
    const { server_id, user_id, content, media_url, media_type, mentioned_user_ids } = body.messageData;
    // Only insert fields that exist in server_messages
    const messageInsertPayload = { server_id, user_id, content, media_url, media_type }

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
      .insert(messageInsertPayload)
      .select('*, profiles(username, avatar_url)')
      .single();

    if (messageError) {
      console.error('Error inserting message:', messageError);
      throw messageError;
    }
    if (!newMessage) {
      console.error('Failed to create message, insert returned no data.');
      throw new Error('Failed to create message.');
    }
    console.log('Message inserted successfully:', newMessage.id);

    // 2. Create notifications for mentions (if any)
    if (Array.isArray(mentioned_user_ids) && mentioned_user_ids.length > 0) {
      for (const recipientId of mentioned_user_ids) {
        const { error: notifError } = await supabaseClient
          .from('notifications')
          .insert({
            recipient_id: recipientId,
            sender_id: user_id,
            type: 'mention',
            reference_id: newMessage.id, // message id as uuid
            server_id: server_id,
            is_read: false
          });
        if (notifError) {
          console.error('Error creating mention notification:', notifError);
        }
      }
    }

    console.log('Returning successful response for message ID:', newMessage.id);
    return new Response(JSON.stringify({ data: newMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(`[ERROR] in send-server-message:`, error);
    let message = 'An unknown error occurred. Please check the function logs for more details.';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      message = String((error as { message: string }).message);
    } else if (typeof error === 'string') {
      message = error;
    }

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

