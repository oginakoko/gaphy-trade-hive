
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

async function getUser(req: Request, supabaseClient: SupabaseClient) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Missing authorization header')
  const { data: { user }, error } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
  if (error || !user) throw new Error('Invalid JWT or user not found')
  return user
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messageId } = await req.json()
    if (!messageId) {
      return new Response(JSON.stringify({ error: 'messageId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase environment variables.');

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const requestingUser = await getUser(req, supabaseClient);

    const { data: message, error: msgError } = await supabaseAdmin.from('server_messages').select('user_id, server_id').eq('id', messageId).single();
    if (msgError || !message) throw new Error('Message not found.');

    let canDelete = false;
    if (message.user_id === requestingUser.id) {
      canDelete = true;
    } else {
      const { data: server, error: serverError } = await supabaseAdmin.from('servers').select('owner_id').eq('id', message.server_id).single();
      if (serverError || !server) throw new Error('Server not found for message.');
      if (server.owner_id === requestingUser.id) {
        canDelete = true;
      }
    }

    if (!canDelete) {
      return new Response(JSON.stringify({ error: 'You do not have permission to delete this message.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }
    
    const { error: deleteError } = await supabaseAdmin.from('server_messages').delete().eq('id', messageId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ message: 'Message deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
