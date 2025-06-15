
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
    const { serverId, userId } = await req.json()
    if (!serverId || !userId) {
      return new Response(JSON.stringify({ error: 'serverId and userId are required' }), {
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

    const { data: server, error: serverError } = await supabaseAdmin.from('servers').select('owner_id').eq('id', serverId).single()
    if (serverError || !server) throw new Error('Server not found.')

    if (server.owner_id !== requestingUser.id) {
      return new Response(JSON.stringify({ error: 'Only the server owner can remove members.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    if (userId === server.owner_id) {
      return new Response(JSON.stringify({ error: "Cannot remove the server owner." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    const { error: deleteError } = await supabaseAdmin.from('server_members').delete().eq('server_id', serverId).eq('user_id', userId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ message: 'Member removed successfully' }), {
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

