
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { TradeIdea, Ad, AffiliateLink } from '@/types';
import { Server } from '@/types/server';
import { useAuth } from '@/hooks/useAuth';

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

const fetchPublicServers = async (): Promise<Server[]> => {
    const { data, error } = await supabase
        .from('servers')
        .select('*, profiles!owner_id(username, avatar_url)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error fetching servers:', error);
        return [];
    }
    return data || [];
};

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

export type FeedItem = (TradeIdea & { viewType: 'idea' }) | (Ad & { viewType: 'ad' }) | (Server & { viewType: 'server' });

export const useAnalysisFeed = () => {
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
    
    const { data: servers, isLoading: isLoadingServers, error: serversError } = useQuery({
        queryKey: ['publicServersForFeed'],
        queryFn: fetchPublicServers,
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

    const userLikes = new Set<number>(userLikesData);

    const feed = useMemo((): FeedItem[] => {
        const ideas: (TradeIdea & { viewType: 'idea' })[] = (tradeIdeas || []).map(idea => ({ ...idea, viewType: 'idea' }));
        const approvedAds: (Ad & { viewType: 'ad' })[] = (ads || []).map(ad => ({ ...ad, viewType: 'ad' }));
        const publicServers: (Server & { viewType: 'server' })[] = (servers || []).map(server => ({ ...server, viewType: 'server' }));
    
        const promotedLinks: (Ad & { viewType: 'ad' })[] = (affiliateLinks || []).map((link, index) => ({
            id: -(index + 1),
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
            start_date: null,
            end_date: null,
            cost: null,
            viewType: 'ad'
        }));
        
        const allAds = [...approvedAds, ...promotedLinks];
        const allContent = [...publicServers, ...allAds];
    
        if (!ideas.length) {
            return allContent;
        }
        
        const combinedFeed: FeedItem[] = [...ideas];
        let contentIndex = 0;
        const contentInterval = 4;
    
        for (let i = contentInterval; i < combinedFeed.length; i += (contentInterval + 1)) {
            if (contentIndex < allContent.length) {
                combinedFeed.splice(i, 0, allContent[contentIndex]);
                contentIndex++;
            }
        }
    
        if (contentIndex < allContent.length) {
            combinedFeed.push(...allContent.slice(contentIndex));
        }
        
        return combinedFeed;
      }, [tradeIdeas, ads, affiliateLinks, servers]);

      const isLoading = isLoadingIdeas || isLoadingAds || isLoadingAffiliates || isLoadingServers;
      const error = ideasError || adsError || affiliatesError || serversError;

      return { feed, isLoading, error, userLikes };
};
