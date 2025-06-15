import React, { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import TradeIdeaCard from '@/components/trade-ideas/TradeIdeaCard';
import { Button } from '@/components/ui/button';
import DonationModal from '@/components/DonationModal';
import { Gem, Bot } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { TradeIdea, Ad } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import AdCard from '@/components/ads/AdCard';
import GaphyBot from '@/components/landing/GaphyBot';

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

// Type and fetcher for affiliate links, as they'll be mixed into the ads feed
interface AffiliateLink {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
}

const fetchAffiliateLinks = async (): Promise<AffiliateLink[]> => {
    const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching affiliate links:', error);
        return [];
    }
    return data || [];
};


const Analysis = () => {
  const [isDonationModalOpen, setDonationModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user } = useAuth();
  const { data: tradeIdeas, isLoading: isLoadingIdeas, error: ideasError } = useQuery({
    queryKey: ['tradeIdeas'], 
    queryFn: fetchTradeIdeas
  });

  const { data: ads, isLoading: isLoadingAds, error: adsError } = useQuery({
    queryKey: ['approvedAds'],
    queryFn: fetchApprovedAds,
  });

  const { data: affiliateLinks, isLoading: isLoadingAffiliates, error: affiliatesError } = useQuery({
    queryKey: ['affiliateLinks'],
    queryFn: fetchAffiliateLinks,
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

    const promotedLinks: (Ad & { viewType: 'ad' })[] = (affiliateLinks || []).map((link, index) => ({
        id: -(index + 1), // Use a unique negative number to avoid conflicts with real ad IDs
        user_id: 'system-affiliate',
        title: link.title,
        content: link.description,
        image_url: null,
        link_url: link.url,
        status: 'approved',
        created_at: new Date().toISOString(),
        profiles: {
            username: 'Promoted',
            avatar_url: '/placeholder.svg'
        },
        // Add missing properties to conform to Ad type
        start_date: null,
        end_date: null,
        cost: null,
        viewType: 'ad'
    }));
    
    const allAds = [...approvedAds, ...promotedLinks];

    if (!ideas.length) {
        return allAds;
    }
    
    // Intersperse ads into ideas
    const feed: FeedItem[] = [...ideas];

    let adIndex = 0;
    const adInterval = 4; // Show an ad every 4 trade ideas

    for (let i = adInterval; i < feed.length; i += (adInterval + 1)) {
        if (adIndex < allAds.length) {
            feed.splice(i, 0, allAds[adIndex]);
            adIndex++;
        }
    }

    // Add any remaining ads to the end
    if (adIndex < allAds.length) {
        feed.push(...allAds.slice(adIndex));
    }
    
    return feed;
  }, [tradeIdeas, ads, affiliateLinks]);

  const isLoading = isLoadingIdeas || isLoadingAds || isLoadingAffiliates;
  const error = ideasError || adsError || affiliatesError;

  return (
    <>
      <Header />
      <main className="py-8 container mx-auto px-4">
        <div className="flex justify-center">
            <div className="w-full max-w-xl space-y-8">
                {isLoading && (
                    <>
                    <Skeleton className="h-[380px] w-full rounded-xl glass-card" />
                    <Skeleton className="h-[380px] w-full rounded-xl glass-card" />
                    </>
                )}
                {error && <p className="text-center text-red-500 p-8 glass-card">Error loading content: {(error as Error).message}</p>}
                
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
                    <div className="glass-card rounded-xl p-8 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">No Content Yet</h3>
                    <p className="text-gray-400">Check back soon for new trade ideas and more!</p>
                    </div>
                )}
            </div>
        </div>
      </main>
      
      <Button 
        onClick={() => setDonationModalOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-brand-green hover:bg-brand-green/80 text-black shadow-lg shadow-brand-green/30 flex items-center justify-center z-40"
      >
        <Gem size={28} />
      </Button>

      <div className="fixed bottom-24 right-6 z-50">
        {!isChatOpen && (
          <Button
            size="icon"
            className="rounded-full h-16 w-16 bg-brand-green text-black hover:bg-brand-green/80 shadow-lg transform transition-transform hover:scale-110 animate-fade-in-up"
            onClick={() => setIsChatOpen(true)}
          >
            <Bot className="h-8 w-8" />
          </Button>
        )}
      </div>

      {isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50">
            <GaphyBot onClose={() => setIsChatOpen(false)} />
        </div>
      )}

      <DonationModal isOpen={isDonationModalOpen} onClose={() => setDonationModalOpen(false)} />
    </>
  );
};

export default Analysis;
