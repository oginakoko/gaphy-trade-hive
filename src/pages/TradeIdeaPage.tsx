import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { TradeIdea } from '@/types';
import Header from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Comments from '@/components/comments/Comments';

const fetchTradeIdea = async (id: string): Promise<TradeIdea> => {
  const { data, error } = await supabase
    .from('trade_ideas')
    .select('*, profiles(username, avatar_url)')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as TradeIdea;
};

const TradeIdeaPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: idea, isLoading, error } = useQuery({
    queryKey: ['tradeIdea', id],
    queryFn: () => fetchTradeIdea(id!),
    enabled: !!id,
  });

  const authorName = idea?.profiles?.username || 'Anonymous';
  const authorAvatar = idea?.profiles?.avatar_url || '/placeholder.svg';

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <Button asChild variant="ghost" className="mb-4 -ml-4">
                <Link to="/" className="flex items-center gap-2 text-brand-green hover:text-brand-green/80">
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
          {error && <p className="text-center text-red-500 p-8 glass-card">Error loading trade idea: {(error as Error).message}</p>}
          {idea && (
             <>
                <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up">
                    {idea.image_url && <img src={idea.image_url} alt={idea.title} className="w-full h-auto max-h-[500px] object-cover" />}
                    <div className="p-6 md:p-10">
                        <div className="flex items-center gap-3 mb-4">
                            <img src={authorAvatar} alt={authorName} className="h-10 w-10 rounded-full bg-brand-gray-200 object-cover" />
                            <div>
                                <p className="font-bold text-white">{authorName}</p>
                                <p className="text-sm text-brand-green">{idea.instrument}</p>
                            </div>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-200 mb-6">{idea.title}</h1>
                        <div className="prose prose-lg prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{idea.breakdown}</ReactMarkdown>
                        </div>
                        <div className="flex gap-2 flex-wrap mt-8">
                            {idea.tags?.map(tag => (
                            <span key={tag} className="bg-brand-gray-200 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-full">
                                {tag}
                            </span>
                            ))}
                        </div>
                    </div>
                </div>
                <Comments tradeIdeaId={idea.id} />
             </>
          )}
        </div>
      </main>
    </>
  );
};

export default TradeIdeaPage;
