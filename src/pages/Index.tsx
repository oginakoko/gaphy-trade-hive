import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import AffiliateLinks from '@/components/AffiliateLinks';
import TradeIdeaCard from '@/components/trade-ideas/TradeIdeaCard';
import { Button } from '@/components/ui/button';
import DonationModal from '@/components/DonationModal';
import { Gem } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { TradeIdea } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const fetchTradeIdeas = async (): Promise<TradeIdea[]> => {
    const { data, error } = await supabase
        .from('trade_ideas')
        .select('*, profiles(username, avatar_url), likes(count)')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }
    // The select query with join returns the nested profile data in a `profiles` property
    // which might be an object or null. We'll cast it to the expected type.
    return data as TradeIdea[];
};


const Index = () => {
  const [isDonationModalOpen, setDonationModalOpen] = useState(false);
  const { user } = useAuth();
  const { data: tradeIdeas, isLoading, error } = useQuery({
    queryKey: ['tradeIdeas'], 
    queryFn: fetchTradeIdeas
  });

  const { data: userLikesData } = useQuery({
    queryKey: ['userLikes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('likes')
        .select('trade_idea_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map((like) => like.trade_idea_id);
    },
    enabled: !!user,
  });

  const userLikes = new Set(userLikesData);

  return (
    <>
      <Header />
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8">
        <div className="lg:col-span-2 space-y-8">
          {isLoading && (
            <>
              <Skeleton className="h-[358px] w-full rounded-xl glass-card" />
              <Skeleton className="h-[358px] w-full rounded-xl glass-card" />
            </>
          )}
          {error && <p className="text-center text-red-500 p-8 glass-card">Error loading trade ideas: {(error as Error).message}</p>}
          {tradeIdeas?.map((idea) => {
            const likesCount = idea.likes?.[0]?.count || 0;
            const userHasLiked = userLikes.has(Number(idea.id));
            return (
              <TradeIdeaCard
                key={idea.id}
                idea={idea}
                likesCount={likesCount}
                userHasLiked={userHasLiked}
              />
            );
          })}
          {tradeIdeas?.length === 0 && !isLoading && !error && (
            <div className="glass-card rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold text-white mb-2">No Trade Ideas Yet</h3>
              <p className="text-gray-400">Be the first to see a new idea. Check back soon!</p>
            </div>
          )}
        </div>
        <aside className="space-y-8">
          <AffiliateLinks />
          <div className="glass-card rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Post Your Ad</h3>
            <p className="text-gray-400 mb-4">Reach a dedicated audience of traders and investors.</p>
             <Button asChild className="w-full bg-brand-green text-black font-bold hover:bg-brand-green/80">
              <Link to="/create-ad">Create an Ad</Link>
            </Button>
            <p className="text-xs text-gray-500 mt-2">Requires payment and admin approval.</p>
          </div>
        </aside>
      </main>
      
      <Button 
        onClick={() => setDonationModalOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-brand-green hover:bg-brand-green/80 text-black shadow-lg shadow-brand-green/30 flex items-center justify-center"
      >
        <Gem size={28} />
      </Button>

      <DonationModal isOpen={isDonationModalOpen} onClose={() => setDonationModalOpen(false)} />
    </>
  );
};

export default Index;
