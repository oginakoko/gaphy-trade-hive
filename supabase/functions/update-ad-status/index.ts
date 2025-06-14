
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    // Create a Supabase client with the service_role key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Update the ad status
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
