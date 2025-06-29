import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';
import { analyzeTradeIdea, TradeData } from '@/lib/openrouter';
import { useAuth } from './useAuth';

export interface TradeTracking {
  id: string;
  trade_idea_id: string;
  asset: string;
  direction: 'Long' | 'Short';
  entry_price?: number;
  exit_price?: number;
  target_price?: number;
  stop_loss?: number;
  risk_reward?: number;
  status: 'open' | 'closed' | 'cancelled';
  created_at: string;
  updated_at: string;
  closed_at?: string;
  user_id: string;
  sentiment?: 'Bullish' | 'Bearish' | 'Neutral';
  key_points?: string[];
}

export const useTradeTracking = (tradeIdeaId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch trades for a specific trade idea or all trades
  const { data: trades, isLoading, error } = useQuery({
    queryKey: ['trades', tradeIdeaId],
    queryFn: async () => {
      let query = supabase
        .from('trade_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (tradeIdeaId) {
        query = query.eq('trade_idea_id', tradeIdeaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TradeTracking[];
    },
    enabled: !!user
  });

  // Create a new trade
  const createTrade = useMutation({
    mutationFn: async (data: Omit<TradeTracking, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: newTrade, error } = await supabase
        .from('trade_tracking')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return newTrade;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    }
  });

  // Update an existing trade
  const updateTrade = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TradeTracking> & { id: string }) => {
      const payload = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: updatedTrade, error } = await supabase
        .from('trade_tracking')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedTrade;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    }
  });

  // Close a trade
  const closeTrade = useMutation({
    mutationFn: async ({ id, exit_price }: { id: string; exit_price: number }) => {
      const { data: closedTrade, error } = await supabase
        .from('trade_tracking')
        .update({
          status: 'closed',
          exit_price,
          closed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return closedTrade;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    }
  });

  // Analyze trade content
  const analyzeTrade = async (content: string) => { // Ensure it expects a string
    if (!user) return null;
    const tradeData = await analyzeTradeIdea(content);
    
    if (tradeData && tradeIdeaId) {
      // Omit sentiment and key_points before sending to Supabase
      const { key_points, sentiment, ...rest } = tradeData;
      return createTrade.mutateAsync({
        ...rest,
        trade_idea_id: tradeIdeaId,
        user_id: user.id
      });
    }
    
    return null;
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('trade_tracking_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_tracking',
          filter: tradeIdeaId ? `trade_idea_id=eq.${tradeIdeaId}` : undefined
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['trades'] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, tradeIdeaId, queryClient]);

  return {
    trades,
    isLoading,
    error,
    createTrade,
    updateTrade,
    closeTrade,
    analyzeTrade
  };
};
