
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Safaricom Daraja API URLs (Sandbox)
const DARJA_AUTH_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
const STK_PUSH_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { amount, phone, userId, type, adId } = await req.json()

    // Validate input
    if (!amount || !phone || !userId || !type) {
        return new Response(JSON.stringify({ error: 'Missing required fields: amount, phone, userId, type' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    const MPESA_CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY')
    const MPESA_CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET')
    const MPESA_BUSINESS_SHORT_CODE = Deno.env.get('MPESA_BUSINESS_SHORT_CODE')
    const MPESA_PASS_KEY = Deno.env.get('MPESA_PASS_KEY')
    
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_BUSINESS_SHORT_CODE || !MPESA_PASS_KEY) {
        return new Response(JSON.stringify({ error: 'M-Pesa environment variables not set in Supabase secrets.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    // 1. Get OAuth Token
    const auth = btoa(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`)
    const tokenResponse = await fetch(DARJA_AUTH_URL, {
      headers: { 'Authorization': `Basic ${auth}` }
    })
    const { access_token } = await tokenResponse.json()
    
    // 2. Prepare STK Push Request
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
    const password = btoa(`${MPESA_BUSINESS_SHORT_CODE}${MPESA_PASS_KEY}${timestamp}`)
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`;

    const payload = {
      BusinessShortCode: MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', // or "CustomerBuyGoodsOnline" for Till Numbers
      Amount: amount,
      PartyA: phone,
      PartyB: MPESA_BUSINESS_SHORT_CODE,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: type === 'ad_payment' && adId ? `AD_${adId}` : 'DONATION',
      TransactionDesc: type === 'ad_payment' ? `Ad Payment for ID ${adId}` : 'Hive Donation',
    }
    
    // 3. Invoke STK Push
    const stkResponse = await fetch(STK_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify(payload)
    })

    const stkData = await stkResponse.json()
    
    if (!stkResponse.ok || stkData.ResponseCode !== '0') {
        throw new Error(stkData.errorMessage || stkData.ResponseDescription || 'STK push initiation failed');
    }
    
    // 4. Save pending transaction to Supabase
    const { CheckoutRequestID, CustomerMessage } = stkData;

    if (CheckoutRequestID) {
        const { error: insertError } = await supabaseClient
            .from('mpesa_transactions')
            .insert({
                user_id: userId,
                ad_id: adId,
                phone_number: phone,
                amount: amount,
                checkout_request_id: CheckoutRequestID,
                status: 'pending',
                type: type,
            });

        if (insertError) {
            console.error('Error saving transaction to Supabase:', insertError);
            // Don't fail the whole request, just log it. The callback will handle updates.
        }
    } else {
         throw new Error(stkData.errorMessage || 'STK push initiation failed, no CheckoutRequestID returned.');
    }

    return new Response(JSON.stringify({ message: CustomerMessage || 'Request accepted for processing.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
