import { supabase } from './supabaseClient';
import { classifyIntent } from './openrouter';
import { TradeIdea } from '@/types';

/**
 * Fetches data from Supabase based on user intent and role.
 * @param prompt The user prompt to classify intent from.
 * @param userId The ID of the user making the request.
 * @param isAdmin Whether the user has admin privileges.
 * @returns Promise<any> The fetched data based on intent and permissions.
 */
export async function fetchDataForAI(prompt: string, userId: string, isAdmin: boolean): Promise<any> {
  const provider = localStorage.getItem('selectedAIProvider') || 'OpenRouter';
  console.log(`Using AI provider: ${provider} for intent classification`);
  const intent = await classifyIntent(prompt, provider);
  console.log(`Classified intent: ${intent}`);

  if (intent === 'user_content') {
    // Fetch user's own trade ideas, limited to prevent token overload
    const { data, error } = await supabase
      .from('trade_ideas')
      .select('id, title, instrument, breakdown, image_url, tags, user_id, created_at, is_pinned')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching user trade ideas:', error.message, error.details);
      throw new Error(`Failed to fetch your trade ideas: ${error.message}`);
    }
    return { type: 'user_trade_ideas', data };
  } else if (intent === 'admin_data' && isAdmin) {
    // Fetch all trade ideas for admin, limited to prevent token overload
    const { data, error } = await supabase
      .from('trade_ideas')
      .select('id, title, instrument, breakdown, image_url, tags, user_id, created_at, is_pinned')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching all trade ideas:', error.message, error.details);
      throw new Error(`Failed to fetch all trade ideas: ${error.message}`);
    }
    return { type: 'all_trade_ideas', data };
  } else if (intent === 'admin_data' && !isAdmin) {
    throw new Error('You do not have permission to access all app data.');
  } else {
    // Default case: no specific data fetch
    return { type: 'none', data: null };
  }
}

/**
 * Summarizes trade ideas for inclusion in AI responses.
 * @param tradeIdeas The list of trade ideas to summarize.
 * @returns string A summarized text of the trade ideas.
 */
export function summarizeTradeIdeas(tradeIdeas: TradeIdea[]): string {
  if (!tradeIdeas || tradeIdeas.length === 0) {
    return 'No trade ideas found.';
  }

  let summary = `Found ${tradeIdeas.length} trade idea(s):\n`;
  tradeIdeas.slice(0, 5).forEach((idea, index) => {
    const breakdownText = Array.isArray(idea.breakdown) ? idea.breakdown.join(' ') : idea.breakdown;
    summary += `${index + 1}. ${idea.title} (${idea.instrument}) - ${breakdownText?.length > 100 ? breakdownText.substring(0, 100) + '...' : breakdownText}\n`;
  });

  if (tradeIdeas.length > 5) {
    summary += `...and ${tradeIdeas.length - 5} more.`;
  }
  return summary;
}
