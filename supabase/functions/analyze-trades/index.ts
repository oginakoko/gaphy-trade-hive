import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TradeAnalysis {
  trade_idea_id: number;
  analyzed_text: string;
  entry_price?: number;
  exit_price?: number;
  target_price?: number;
  stop_loss?: number;
  risk_reward?: number;
  direction?: 'Long' | 'Short';
  asset?: string;
  sentiment?: 'Bullish' | 'Bearish' | 'Neutral';
  key_points?: string[];
}

const analyzeTradeIdea = async (content: string): Promise<TradeAnalysis | null> => {
  const messages = [
    {
      role: 'system',
      content: `Analyze the trade idea and extract:
        - Asset name
        - Trade direction (Long/Short)
        - Entry price
        - Target price
        - Stop loss
        - Overall sentiment
        - Key points (max 3)
        Only include numerical values when explicitly stated.`
    },
    {
      role: 'user',
      content
    }
  ];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${Deno.env.get('OPENROUTER_API_KEY')}\`,
        'HTTP-Referer': 'https://gaphyhive.com',
        'X-Title': 'GaphyHive'
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-coder-33b-instruct',
        messages,
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(result);
      if (!parsed.asset && !parsed.entry_price && !parsed.target_price) {
        return null;
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse analysis:', e);
      return null;
    }
  } catch (error) {
    console.error('Error analyzing trade:', error);
    return null;
  }
};

Deno.serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get unanalyzed trade ideas
    const { data: tradeIdeas, error: fetchError } = await supabaseClient
      .from('trade_ideas')
      .select('id, breakdown')
      .not('id', 'in', `(select trade_idea_id from trade_analysis)`)
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    // Analyze each trade idea
    for (const idea of tradeIdeas) {
      const analysis = await analyzeTradeIdea(idea.breakdown);
      
      if (analysis) {
        const { error: insertError } = await supabaseClient
          .from('trade_analysis')
          .insert([{
            trade_idea_id: idea.id,
            ...analysis
          }]);

        if (insertError) {
          console.error(\`Error saving analysis for trade \${idea.id}:\`, insertError);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: tradeIdeas.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
