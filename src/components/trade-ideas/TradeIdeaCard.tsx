import { TradeIdea } from '@/types';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LikeButton from './LikeButton';

interface TradeIdeaCardProps {
  idea: TradeIdea;
  likesCount: number;
  userHasLiked: boolean;
}

const TradeIdeaCard = ({ idea, likesCount, userHasLiked }: TradeIdeaCardProps) => {
  const authorName = idea.profiles?.username || 'Anonymous';
  const authorAvatar = idea.profiles?.avatar_url || '/placeholder.svg';
  
  const snippet = idea.breakdown.length > 150 
    ? idea.breakdown.substring(0, 150) + '...' 
    : idea.breakdown;

  return (
    <div className="group glass-card rounded-xl overflow-hidden animate-fade-in-up h-full flex flex-col transition-all duration-300 hover:border-brand-green/40 hover:shadow-xl hover:shadow-brand-green/10">
      {idea.image_url && 
        <Link to={`/trade-ideas/${idea.id}`} className="block">
          <img src={idea.image_url} alt={idea.title} className="w-full h-48 object-cover" />
        </Link>
      }
      <div className="p-6 flex flex-col flex-grow">
          <div className="flex items-center gap-3 mb-4">
          <img src={authorAvatar} alt={authorName} className="h-10 w-10 rounded-full bg-brand-gray-200 object-cover" />
          <div>
              <p className="font-bold text-white">{authorName}</p>
              <p className="text-sm text-brand-green">{idea.instrument}</p>
          </div>
          </div>
          <h3 className="text-xl font-bold text-gray-300 mb-2 group-hover:text-white transition-colors">
            <Link to={`/trade-ideas/${idea.id}`} className="hover:text-white transition-colors">{idea.title}</Link>
          </h3>
          <div className="prose prose-sm prose-invert text-gray-400 mb-4 flex-grow max-w-none overflow-hidden">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {snippet}
            </ReactMarkdown>
          </div>

          <div className="flex items-center justify-between text-gray-400 mt-auto pt-4 border-t border-white/10">
              <div className="flex items-center gap-4">
                  <LikeButton
                      tradeIdeaId={idea.id}
                      initialLikesCount={likesCount}
                      initialIsLiked={userHasLiked}
                  />
                  <div className="flex gap-2 flex-wrap">
                      {idea.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="bg-brand-gray-200 text-gray-300 text-xs font-medium px-2 py-1 rounded-full">
                          {tag}
                      </span>
                      ))}
                  </div>
              </div>
              <Link to={`/trade-ideas/${idea.id}`} className="flex items-center gap-2 text-brand-green">
                  Read More
                  <ArrowUpRight size={18} className="transform transition-transform duration-300 group-hover:rotate-45" />
              </Link>
          </div>
      </div>
    </div>
  );
};

export default TradeIdeaCard;
