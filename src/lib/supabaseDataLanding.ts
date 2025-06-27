import { supabase } from './supabaseClient';
import { TradeIdea } from '@/types';

/**
 * Centralized data fetching for app-wide data from Supabase.
 * This file serves as a landing point for data to be used by AI and various pages.
 */

/**
 * Fetches the total number of users in the app.
 * @returns Promise<number> The total count of users.
 */
export async function getUserCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Error fetching user count:', error.message, error.details);
      throw new Error(`Failed to fetch user count: ${error.message}`);
    }
    return count || 0;
  } catch (error) {
    console.error('Unexpected error fetching user count:', error);
    throw error;
  }
}

/**
 * Fetches all trade ideas for admin access or AI processing.
 * @param limit Optional limit on the number of trade ideas to fetch.
 * @returns Promise<TradeIdea[]> Array of trade ideas.
 */
export async function getAllTradeIdeas(limit: number = 100): Promise<TradeIdea[]> {
  try {
    const { data, error } = await supabase
      .from('trade_ideas')
      .select('id, title, instrument, breakdown, image_url, tags, status, entry_price, target_price, stop_loss, risk_reward, sentiment, key_points, direction, is_pinned, is_featured, user_id, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching all trade ideas:', error.message, error.details);
      throw new Error(`Failed to fetch all trade ideas: ${error.message}`);
    }
    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching trade ideas:', error);
    throw error;
  }
}

/**
 * Fetches a summary of app data for AI or admin dashboard.
 * @returns Promise<object> Summary data including user count and trade ideas count.
 */
export async function getAppDataSummary(): Promise<object> {
  try {
    const userCount = await getUserCount();
    const tradeIdeas = await getAllTradeIdeas(0); // 0 limit means fetch count only if possible, but here we fetch all for simplicity
    const tradeIdeasCount = tradeIdeas.length;

    return {
      userCount,
      tradeIdeasCount,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching app data summary:', error);
    throw error;
  }
}

/**
 * This function can be extended to fetch other types of data as needed.
 * For example, notifications, messages, or server data.
 */
