import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { TradeIdea } from '@/types';
import { MediaItem } from '@/types/media';
import Header from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Comments from '@/components/comments/Comments';
import { useAuth } from '@/hooks/useAuth';
import LikeButton from '@/components/trade-ideas/LikeButton';
import InlineMediaRenderer from '@/components/trade-ideas/InlineMediaRenderer';
import { useTradeTracking } from '@/hooks/useTradeTracking';
import { TradeTrackingTable } from '@/components/trade-ideas/TradeTrackingTable';

interface ExtendedTradeIdea extends TradeIdea {
  media: MediaItem[];
}

const fetchTradeIdea = async (id: string): Promise<ExtendedTradeIdea> => {
  console.log('Fetching trade idea:', id);

  const [ideaResponse, mediaResponse] = await Promise.all([
    supabase
      .from('trade_ideas')
      .select('*, profiles(username, avatar_url), likes(count)')
      .eq('id', id)
      .single(),
    supabase
      .from('trade_idea_media')
      .select('*')
      .eq('trade_idea_id', id)
      .order('position')
  ]);

  if (ideaResponse.error) {
    console.error('Error fetching trade idea:', ideaResponse.error);
    throw new Error(ideaResponse.error.message);
  }

  const idea = ideaResponse.data as ExtendedTradeIdea;
  idea.media = [];

  if (!mediaResponse.error && mediaResponse.data) {
    console.log('Fetched media items:', mediaResponse.data);
    idea.media = mediaResponse.data.map(item => ({
      id: item.placeholder_id || item.id.toString(), // Use placeholder_id if available, otherwise convert DB id to string
      type: item.media_type as 'image' | 'video' | 'link',
      url: item.url,
      title: item.title || undefined,
      description: item.description || undefined,
      thumbnail_url: item.thumbnail_url || undefined
    }));
  }

  console.log('Processed trade idea with media:', idea);
  return idea;
};

const TradeIdeaPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    trades,
    isLoading: isLoadingTrades,
    analyzeTrade
  } = useTradeTracking(id);

  const { data: idea, isLoading, error } = useQuery({
    queryKey: ['tradeIdea', id],
    queryFn: () => fetchTradeIdea(id!),
    enabled: !!id,
  });

  const { data: userHasLiked, isLoading: isLoadingUserLike } = useQuery({
    queryKey: ['userLikes', user?.id, id],
    queryFn: async () => {
      if (!user || !id) return false;
      const { data, error } = await supabase
        .from('likes')
        .select('trade_idea_id')
        .eq('user_id', user.id)
        .eq('trade_idea_id', Number(id))
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!id,
  });

  // Analyze trade on load
  useEffect(() => {
    if (idea?.breakdown && !trades?.length) {
      analyzeTrade(idea.breakdown);
    }
  }, [idea?.breakdown, trades?.length]);

  const authorName = idea?.profiles?.username || 'Anonymous';
  const authorAvatar = idea?.profiles?.avatar_url || '/placeholder.svg';

  console.log('Rendering trade idea:', idea);

  if (isLoading || isLoadingTrades) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4 animate-pulse">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !idea) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl text-red-500">Error loading trade idea</h1>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button asChild variant="ghost" className="mb-4 -ml-4">
            <Link to="/analysis" className="flex items-center gap-2 text-brand-green hover:text-brand-green/80">
              <ArrowLeft size={16} />
              Back to Analysis
            </Link>
          </Button>

          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <img src={authorAvatar} alt={authorName} className="h-12 w-12 rounded-full" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">{idea.title}</h1>
                    <p className="text-brand-green">{idea.instrument}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <LikeButton 
                    tradeIdeaId={String(idea.id)}
                    initialLikesCount={idea.likes?.[0]?.count || 0}
                    initialIsLiked={!!userHasLiked}
                  />
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <InlineMediaRenderer content={idea.breakdown} mediaItems={idea.media || []} />
              </div>

              {trades && trades.length > 0 && (
                <TradeTrackingTable trades={trades} />
              )}

              <Comments tradeIdeaId={idea.id} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default TradeIdeaPage;
