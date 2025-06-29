import { createClient, SupabaseClient } from "https://esm.sh/v135/@supabase/supabase-js@2.43.0";
import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

async function getUser(req: Request, supabaseClient: SupabaseClient) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing authorization header');
  const { data: { user }, error } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
  if (error || !user) throw new Error('Invalid JWT or user not found');
  return user;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { serverId, userId } = await req.json();
    if (!serverId || !userId) {
      return new Response(JSON.stringify({ error: 'serverId and userId are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase environment variables.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    const supabaseClient = createClient(supabaseUrl, anonKey);
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const requestingUser = await getUser(req, supabaseClient);

    const { data: server, error: serverError } = await supabaseAdmin.from('servers').select('owner_id').eq('id', serverId).single();
    if (serverError || !server) {
      return new Response(JSON.stringify({ error: 'Server not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (server.owner_id !== requestingUser.id) {
      return new Response(JSON.stringify({ error: 'Only the server owner can remove members.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    if (userId === server.owner_id) {
      return new Response(JSON.stringify({ error: 'Cannot remove the server owner.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { error: deleteError } = await supabaseAdmin.from('server_members').delete().eq('server_id', serverId).eq('user_id', userId);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Member removed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

