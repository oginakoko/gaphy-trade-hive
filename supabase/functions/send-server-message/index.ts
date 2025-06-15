
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messageData } = await req.json()
    const { server_id, user_id, content, media_url, media_type, mentioned_users } = messageData

    // Create a Supabase client with the user's auth token
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 1. Insert the message
    const { data: newMessage, error: messageError } = await supabaseClient
      .from('server_messages')
      .insert({ server_id, user_id, content, media_url, media_type })
      .select('*, profiles(username, avatar_url)')
      .single()

    if (messageError) throw messageError
    if (!newMessage) throw new Error('Failed to create message.')

    // 2. Create notifications if there are mentions
    if (mentioned_users && mentioned_users.length > 0) {
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
      }
    }

    return new Response(JSON.stringify({ data: newMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

