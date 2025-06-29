import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { TradeIdea } from '@/types';
import { MediaItem } from '@/types/media';
import Header from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Comments from '@/components/comments/Comments';
import { useAuth } from '@/hooks/useAuth';
import LikeButton from '@/components/trade-ideas/LikeButton';
import InlineMediaRenderer from '@/components/trade-ideas/InlineMediaRenderer';
import { useTradeTracking } from '@/hooks/useTradeTracking';
import { TradeTrackingTable } from '@/components/trade-ideas/TradeTrackingTable';
import MetaTags from '@/components/meta-tags';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ExtendedTradeIdea extends TradeIdea {
  media: MediaItem[];
  breakdown: string[]; // Ensure breakdown is typed as string[]
  is_pinned: boolean;
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

  if (!ideaResponse.data) {
    throw new Error('Trade idea not found');
  }

  const idea = ideaResponse.data as ExtendedTradeIdea;
  idea.media = [];
  // Ensure breakdown is always an array
  if (!idea.breakdown) {
    idea.breakdown = [];
  }

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
  const [currentPageBreakdownIndex, setCurrentPageBreakdownIndex] = useState(0);

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
    if (idea?.breakdown && idea.breakdown.length > 0 && !trades?.length) {
      analyzeTrade(idea.breakdown[0]); // Analyze only the first page for now
    }
  }, [idea?.breakdown, trades?.length]);

  useEffect(() => {
    // Reset to first page when idea changes
    setCurrentPageBreakdownIndex(0);
  }, [id]);

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
      {idea && (
        <MetaTags
          title={idea.title}
          description={idea.breakdown[0]?.replace(/\[MEDIA:[^\]]+\]/g, '').replace(/[#*_`>\-]/g, '').slice(0, 160) || 'Trade idea on GaphyHive'}
          image={idea.media?.find(m => m.type === 'image')?.url || idea.image_url || 'https://gaphyhive.lovable.app/logo.svg'}
          url={`${window.location.origin}/trade-ideas/${idea.id}`}
        />
      )}
      <Header />
      <main className="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
          <Button asChild variant="ghost" className="mb-2 -ml-2 sm:mb-4 sm:-ml-4">
            <Link to="/analysis" className="flex items-center gap-2 text-brand-green hover:text-brand-green/80">
              <ArrowLeft size={16} />
              Back to Analysis
            </Link>
          </Button>

          <div className="space-y-6 sm:space-y-8">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-4 gap-2 sm:gap-0">
                <div className="flex items-center gap-4">
                  <img src={authorAvatar} alt={authorName} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white break-words">{idea.title}</h1>
                    <p className="text-brand-green text-sm sm:text-base">{idea.instrument}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <LikeButton 
                    tradeIdeaId={String(idea.id)}
                    initialLikesCount={idea.likes?.[0]?.count || 0}
                    initialIsLiked={!!userHasLiked}
                  />
                  {user && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${idea.is_pinned ? 'text-brand-green' : 'text-gray-400'} hover:text-white hover:bg-white/10 rounded-full`}
                      onClick={async () => {
                        const { error } = await supabase
                          .from('trade_ideas')
                          .update({ is_pinned: !idea.is_pinned })
                          .eq('id', idea.id);

                        if (error) {
                          console.error('Error updating pin status:', error);
                        } else {
                          // Optimistically update the idea object to reflect the change
                          idea.is_pinned = !idea.is_pinned;
                        }
                      }}
                    >
                      <Pin size={12} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2 sm:mb-4 flex-wrap">
                <span className="text-xs text-gray-400">Trade ID:</span>
                <span className="text-xs font-mono text-brand-green select-all">{idea.id}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-1 h-6 w-6 text-xs text-gray-400 hover:text-brand-green"
                  onClick={() => {
                    navigator.clipboard.writeText(String(idea.id));
                  }}
                >
                  Copy
                </Button>
              </div>
              <div className="prose prose-invert max-w-none text-sm sm:text-base">
                <InlineMediaRenderer content={idea.breakdown[currentPageBreakdownIndex] || ''} mediaItems={idea.media || []} />
              </div>

              {idea.breakdown.length > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); setCurrentPageBreakdownIndex(prev => Math.max(0, prev - 1)); }}
                        className={currentPageBreakdownIndex === 0 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {[...Array(idea.breakdown.length)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => { e.preventDefault(); setCurrentPageBreakdownIndex(index); }}
                          isActive={currentPageBreakdownIndex === index}
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); setCurrentPageBreakdownIndex(prev => Math.min(idea.breakdown.length - 1, prev + 1)); }}
                        className={currentPageBreakdownIndex === idea.breakdown.length - 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}

              {/* Show a message if no AI trade analysis is available */}
              {(!trades || trades.length === 0) && (
                <div className="my-4 sm:my-6 p-3 sm:p-4 rounded-lg bg-yellow-900/20 border border-yellow-700 text-yellow-200 text-xs sm:text-sm">
                  <span>No AI trade analysis was generated for this idea. If this is a new idea, try editing the breakdown to include explicit entry, target, and stop values, then refresh.</span>
                </div>
              )}

              {trades && trades.length > 0 && (
                <div className="mt-4 sm:mt-8">
                  <TradeTrackingTable trades={trades} />
                </div>
              )}

              <div className="mt-4 sm:mt-8">
                <Comments tradeIdeaId={String(idea.id)} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default TradeIdeaPage;
