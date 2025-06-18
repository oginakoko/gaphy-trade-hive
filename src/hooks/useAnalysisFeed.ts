import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { TradeIdea, Ad, AffiliateLink } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const fetchTradeIdeas = async (): Promise<TradeIdea[]> => {
    const { data: ideas, error } = await supabase
        .from('trade_ideas')
        .select('*, profiles(username, avatar_url), likes(count)')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    // Fetch media for all trade ideas
    const { data: mediaItems, error: mediaError } = await supabase
        .from('trade_idea_media')
        .select('*')
        .in('trade_idea_id', ideas.map(idea => idea.id))
        .order('position');

    if (mediaError) {
        console.error('Error fetching media:', mediaError);
        return ideas;
    }

    // Group media by trade idea ID
    const mediaByIdeaId = mediaItems.reduce((acc, media) => {
        if (!acc[media.trade_idea_id]) {
            acc[media.trade_idea_id] = [];
        }
        acc[media.trade_idea_id].push({
            id: media.placeholder_id || media.id.toString(),
            type: media.media_type,
            url: media.url,
            title: media.title,
            description: media.description,
            thumbnail_url: media.thumbnail_url
        });
        return acc;
    }, {} as Record<number, any[]>);

    // Attach media to each trade idea
    return ideas.map(idea => ({
        ...idea,
        media: mediaByIdeaId[idea.id] || []
    }));
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

export type FeedItem = (TradeIdea & { viewType: 'idea' }) | (Ad & { viewType: 'ad' });

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
    
    const { data: userLikesData } = useQuery({
        queryKey: ['userLikes', user?.id],
        queryFn: async () => {
            if (!user) return new Set<number>();
            const { data, error } = await supabase
                .from('likes')
                .select('trade_idea_id')
                .eq('user_id', user.id);
            if (error) {
                console.error('Error fetching user likes:', error);
                throw error;
            }
            return new Set(data.map(like => Number(like.trade_idea_id)));
        },
        enabled: !!user,
        initialData: new Set<number>()
    });

    // Convert userLikesData to a Set if it isn't already one
    const userLikes = userLikesData instanceof Set ? userLikesData : new Set(userLikesData);

    const feed = useMemo((): FeedItem[] => {
        const ideas: (TradeIdea & { viewType: 'idea' })[] = (tradeIdeas || []).map(idea => ({ ...idea, viewType: 'idea' }));
        const approvedAds: (Ad & { viewType: 'ad' })[] = (ads || []).map(ad => ({ ...ad, viewType: 'ad' }));
    
        const promotedLinks: (Ad & { viewType: 'ad' })[] = (affiliateLinks || []).map((link, index) => ({
            id: -(index + 1),
            user_id: 'system-affiliate',
            title: link.title,
            content: link.description,
            link_url: link.url,
            media_url: null,
            media_type: null,
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
        const allContent = [...allAds];
    
        if (!ideas.length) {
            return allContent;
        }
        
        const combinedFeed: FeedItem[] = [...ideas];
        let contentIndex = 0;
        const contentInterval = 5;
    
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
      }, [tradeIdeas, ads, affiliateLinks]);

      const isLoading = isLoadingIdeas || isLoadingAds || isLoadingAffiliates;
      const error = ideasError || adsError || affiliatesError;

      return { feed, isLoading, error, userLikes };
};
