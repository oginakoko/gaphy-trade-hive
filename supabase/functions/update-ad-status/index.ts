
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

// Note: This function needs to be deployed to Supabase to work.
// The Lovable environment will simulate this, but for production,
// you would run `npx supabase functions deploy update-ad-status`.

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

    // Create a Supabase client with the service_role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update the ad status
    const { error } = await supabaseAdmin
      .from('ads')
      .update({ status: status })
      .eq('id', adId)

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ message: 'Ad status updated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
