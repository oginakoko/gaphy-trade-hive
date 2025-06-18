import React from 'react';
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

  const authorName = idea?.profiles?.username || 'Anonymous';
  const authorAvatar = idea?.profiles?.avatar_url || '/placeholder.svg';

  console.log('Rendering trade idea:', idea);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button asChild variant="ghost" className="mb-4 -ml-4">
            <Link to="/analysis" className="flex items-center gap-2 text-brand-green hover:text-brand-green/80">
              <ArrowLeft size={16} />
              Back to all ideas
            </Link>
          </Button>

          {isLoading && (
            <div className="glass-card rounded-xl p-8">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/4 mb-8" />
              <Skeleton className="h-64 w-full" />
            </div>
          )}
          {error && (
            <p className="text-center text-red-500 p-8 glass-card">
              Error loading trade idea: {(error as Error).message}
            </p>
          )}
          {idea && (
            <>
              <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up">
                {idea.image_url && (
                  <img
                    src={idea.image_url}
                    alt={idea.title}
                    className="w-full h-auto max-h-[500px] object-cover"
                  />
                )}
                <div className="p-6 md:p-10">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        className="h-10 w-10 rounded-full bg-brand-gray-200 object-cover"
                      />
                      <div>
                        <p className="font-bold text-white">{authorName}</p>
                        <p className="text-sm text-brand-green">{idea.instrument}</p>
                      </div>
                    </div>
                    {!isLoadingUserLike && id && (
                      <LikeButton
                        tradeIdeaId={id}
                        initialLikesCount={idea.likes?.[0]?.count || 0}
                        initialIsLiked={!!userHasLiked}
                      />
                    )}
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-200 mb-6">
                    {idea.title}
                  </h1>
                  <div className="prose prose-lg prose-invert max-w-none space-y-4">
                    <InlineMediaRenderer
                      content={idea.breakdown}
                      mediaItems={idea.media}
                    />
                  </div>
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-8">
                      {idea.tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-brand-gray-200 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-8">
                <Comments tradeIdeaId={idea.id} />
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default TradeIdeaPage;
