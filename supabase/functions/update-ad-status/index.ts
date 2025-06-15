
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
    const { adId, status } = await req.json()
    if (!adId || !status) {
        return new Response(JSON.stringify({ error: 'adId and status are required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Edge Function: Missing Supabase environment variables.");
        return new Response(JSON.stringify({ error: 'Server is not configured correctly.' }), {
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
             status: 500,
        });
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const requestingUser = await getUser(req, supabaseClient);
    const adminId = '73938002-b3f8-4444-ad32-6a46cbf8e075';
    if (requestingUser.id !== adminId) {
        return new Response(JSON.stringify({ error: 'Only admins can update ad status.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
        });
    }

    const { error } = await supabaseAdmin
      .from('ads')
      .update({ status: status })
      .eq('id', adId)

    if (error) {
      console.error("Edge Function DB Error:", error);
      throw error
    }

    return new Response(JSON.stringify({ message: 'Ad status updated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message ?? 'An unknown server error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
