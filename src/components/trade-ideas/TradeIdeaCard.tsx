
import { TradeIdea } from '@/types';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TradeIdeaCardProps {
  idea: TradeIdea;
}

const TradeIdeaCard = ({ idea }: TradeIdeaCardProps) => {
  const authorName = idea.profiles?.username || 'Anonymous';
  const authorAvatar = idea.profiles?.avatar_url || '/placeholder.svg';
  
  const snippet = idea.breakdown.length > 150 
    ? idea.breakdown.substring(0, 150) + '...' 
    : idea.breakdown;

  return (
    <Link to={`/trade-ideas/${idea.id}`} className="block group">
        <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up h-full flex flex-col transition-all duration-300 group-hover:border-brand-green/40 group-hover:shadow-xl group-hover:shadow-brand-green/10">
        {idea.image_url && <img src={idea.image_url} alt={idea.title} className="w-full h-48 object-cover" />}
        <div className="p-6 flex flex-col flex-grow">
            <div className="flex items-center gap-3 mb-4">
            <img src={authorAvatar} alt={authorName} className="h-10 w-10 rounded-full bg-brand-gray-200 object-cover" />
            <div>
                <p className="font-bold text-white">{authorName}</p>
                <p className="text-sm text-brand-green">{idea.instrument}</p>
            </div>
            </div>
            <h3 className="text-xl font-bold text-gray-300 mb-2 group-hover:text-white transition-colors">{idea.title}</h3>
            <div className="prose prose-sm prose-invert text-gray-400 mb-4 flex-grow max-w-none overflow-hidden">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {snippet}
              </ReactMarkdown>
            </div>

            <div className="flex items-center justify-between text-gray-400 mt-auto pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                    <div className="flex gap-2 flex-wrap">
                        {idea.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-brand-gray-200 text-gray-300 text-xs font-medium px-2 py-1 rounded-full">
                            {tag}
                        </span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-brand-green">
                    Read More
                    <ArrowUpRight size={18} className="transform transition-transform duration-300 group-hover:rotate-45" />
                </div>
            </div>
        </div>
        </div>
    </Link>
  );
};

export default TradeIdeaCard;
