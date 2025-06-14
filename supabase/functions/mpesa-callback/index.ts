
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// This function needs to be publicly accessible without auth.
// We use the SERVICE_ROLE_KEY to bypass RLS.
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const callbackData = await req.json();
        const { Body } = callbackData;
        
        if (!Body || !Body.stkCallback) {
            console.warn("Invalid callback format received", callbackData);
            return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Invalid format" }), { status: 400 });
        }
        
        const { stkCallback } = Body;
        const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
        
        const status = ResultCode === 0 ? 'success' : 'failed';
        
        let updatePayload: any = {
            status: status,
            result_code: ResultCode,
            result_desc: ResultDesc,
            mpesa_receipt_number: null,
            raw_callback: stkCallback,
        }

        if (ResultCode === 0 && CallbackMetadata) {
            const mpesaReceiptItem = CallbackMetadata.Item.find((item: any) => item.Name === 'MpesaReceiptNumber');
            if (mpesaReceiptItem) {
                updatePayload.mpesa_receipt_number = mpesaReceiptItem.Value;
            }
        }
        
        // Update the transaction record in Supabase
        const { data: transaction, error: updateError } = await supabaseAdmin
            .from('mpesa_transactions')
            .update(updatePayload)
            .eq('checkout_request_id', CheckoutRequestID)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating transaction:', updateError);
            // Even if we fail to update our DB, we must respond to Safaricom successfully.
        }
        
        // If payment was successful and it was for an ad, update the ad status
        if (status === 'success' && transaction && transaction.type === 'ad_payment' && transaction.ad_id) {
            const { error: adUpdateError } = await supabaseAdmin
                .from('ads')
                .update({ status: 'pending_approval' })
                .eq('id', transaction.ad_id);

            if (adUpdateError) {
                console.error(`Failed to update ad ${transaction.ad_id} status:`, adUpdateError);
            }
        }
        
        // Respond to Safaricom Gateway to acknowledge receipt
        return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Callback Error:', error.message);
        return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Internal Server Error" }), { status: 500 });
    }
});
