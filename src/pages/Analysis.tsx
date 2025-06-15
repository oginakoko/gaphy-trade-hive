
import React, { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import AffiliateLinks from '@/components/AffiliateLinks';
import TradeIdeaCard from '@/components/trade-ideas/TradeIdeaCard';
import { Button } from '@/components/ui/button';
import DonationModal from '@/components/DonationModal';
import { Gem } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { TradeIdea, Ad } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import AdCard from '@/components/ads/AdCard';

const fetchTradeIdeas = async (): Promise<TradeIdea[]> => {
    const { data, error } = await supabase
        .from('trade_ideas')
        .select('*, profiles(username, avatar_url), likes(count)')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }
    return data as TradeIdea[];
};

const fetchApprovedAds = async (): Promise<Ad[]> => {
    const { data, error } = await supabase
        .from('ads')
        .select('*, profiles(username, avatar_url)')
        .eq('status', 'approved');

    if (error) {
        throw new Error(error.message);
    }
    return data as Ad[];
};


const Analysis = () => {
  const [isDonationModalOpen, setDonationModalOpen] = useState(false);
  const { user } = useAuth();
  const { data: tradeIdeas, isLoading: isLoadingIdeas, error: ideasError } = useQuery({
    queryKey: ['tradeIdeas'], 
    queryFn: fetchTradeIdeas
  });

  const { data: ads, isLoading: isLoadingAds, error: adsError } = useQuery({
    queryKey: ['approvedAds'],
    queryFn: fetchApprovedAds,
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

  type FeedItem = (TradeIdea & { viewType: 'idea' }) | (Ad & { viewType: 'ad' });

  const combinedFeed = useMemo((): FeedItem[] => {
    const ideas: (TradeIdea & { viewType: 'idea' })[] = (tradeIdeas || []).map(idea => ({ ...idea, viewType: 'idea' }));
    const approvedAds: (Ad & { viewType: 'ad' })[] = (ads || []).map(ad => ({ ...ad, viewType: 'ad' }));

    if (!ideas.length) {
        return approvedAds;
    }
    
    // Intersperse ads into ideas
    const feed: FeedItem[] = [...ideas];

    let adIndex = 0;
    const adInterval = 4; // Show an ad every 4 trade ideas

    for (let i = adInterval; i < feed.length; i += (adInterval + 1)) {
        if (adIndex < approvedAds.length) {
            feed.splice(i, 0, approvedAds[adIndex]);
            adIndex++;
        }
    }

    // Add any remaining ads to the end
    if (adIndex < approvedAds.length) {
        feed.push(...approvedAds.slice(adIndex));
    }
    
    return feed;
  }, [tradeIdeas, ads]);

  const isLoading = isLoadingIdeas || isLoadingAds;
  const error = ideasError || adsError;

  return (
    <>
      <Header />
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          {isLoading && (
            <>
              <Skeleton className="h-[420px] w-full rounded-xl glass-card" />
              <Skeleton className="h-[420px] w-full rounded-xl glass-card" />
            </>
          )}
          {error && <p className="md:col-span-2 text-center text-red-500 p-8 glass-card">Error loading content: {(error as Error).message}</p>}
          
          {combinedFeed.map((item) => {
            if (item.viewType === 'idea') {
              const likesCount = item.likes?.[0]?.count || 0;
              const userHasLiked = userLikes.has(Number(item.id));
              return (
                <TradeIdeaCard
                  key={`idea-${item.id}`}
                  idea={item}
                  likesCount={likesCount}
                  userHasLiked={userHasLiked}
                />
              );
            } else { // item.viewType === 'ad'
              return <AdCard key={`ad-${item.id}`} ad={item} />;
            }
          })}

          {combinedFeed.length === 0 && !isLoading && !error && (
            <div className="md:col-span-2 glass-card rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold text-white mb-2">No Content Yet</h3>
              <p className="text-gray-400">Check back soon for new trade ideas and more!</p>
            </div>
          )}
        </div>
        <aside className="space-y-8">
          <AffiliateLinks />
          {/* "Post Your Ad" card removed as per request to make it more subtle */}
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

export default Analysis;
