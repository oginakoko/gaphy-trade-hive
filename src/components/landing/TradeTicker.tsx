
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';

interface TickerIdea {
  id: number;
  title: string;
  instrument: string;
}

const fetchRecentTradeIdeas = async (): Promise<TickerIdea[]> => {
  const { data, error } = await supabase
    .from('trade_ideas')
    .select('id, title, instrument')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching trade ideas for ticker:", error);
    throw new Error(error.message);
  }
  return data as TickerIdea[];
};

const TradeTicker = () => {
    const { data: ideas, isLoading, error } = useQuery({ 
        queryKey: ['recentTradeIdeas'],
        queryFn: fetchRecentTradeIdeas,
        staleTime: 60 * 1000, // 1 minute
    });

    if (isLoading || error || !ideas || ideas.length === 0) {
      // Don't render anything if there's an error or no data, to avoid a broken UI.
      // The error is logged in the fetch function.
      return null;
    }

    const tickerItems = ideas.map(idea => (
      <Link to={`/trade-ideas/${idea.id}`} key={`item-${idea.id}`} className="flex items-center gap-2 hover:text-brand-green transition-colors duration-300">
        <Rocket className="w-4 h-4 text-brand-green/70" />
        <span className="font-semibold">{idea.instrument}</span>
        <span className="text-gray-400">{idea.title}</span>
      </Link>
    ));

    return (
        <div className="bg-background border-y border-white/10 group">
          <div className="relative flex overflow-x-hidden">
              <div className="py-3 flex animate-marquee group-hover:pause whitespace-nowrap">
                  {[...tickerItems, ...tickerItems].map((item, index) => (
                    <div key={index} className="mx-6">
                      {item}
                    </div>
                  ))}
              </div>
          </div>
        </div>
    );
}

export default TradeTicker;
