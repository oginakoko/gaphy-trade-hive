
import { TradeIdea } from '@/types';
import { ArrowUpRight, Edit, Share } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LikeButton from './LikeButton';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

interface TradeIdeaCardProps {
  idea: TradeIdea;
  likesCount: number;
  userHasLiked: boolean;
  isAdmin: boolean;
  onEdit: (idea: TradeIdea) => void;
}

const TradeIdeaCard = ({ idea, likesCount, userHasLiked, isAdmin, onEdit }: TradeIdeaCardProps) => {
  const [copiedItemId, setCopiedItemId] = useState<string | number | null>(null);
  const authorName = idea.profiles?.username || 'Anonymous';
  const authorAvatar = idea.profiles?.avatar_url || '/placeholder.svg';
  
  const snippet = idea.breakdown.trim().length > 70 
    ? idea.breakdown.trim().substring(0, 70) + '...' 
    : idea.breakdown.trim();

  const handleSharePost = async (postId: string | number, title: string) => {
    const shareUrl = `${window.location.origin}/trade-ideas/${postId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedItemId(postId);
      toast({
        title: 'Link Copied',
        description: `"${title}" link has been copied to clipboard`,
      });
      setTimeout(() => setCopiedItemId(null), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative group glass-card rounded-xl overflow-hidden animate-fade-in-up flex flex-col transition-all duration-300 hover:border-brand-green/40 hover:shadow-xl hover:shadow-brand-green/10 h-full">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSharePost(idea.id, idea.title)}
          className="h-8 w-8 p-0 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-white/10"
        >
          <Share size={12} />
        </Button>
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
            onClick={() => onEdit(idea)}
          >
            <Edit size={12} />
          </Button>
        )}
      </div>
      
      {idea.image_url && 
        <Link to={`/trade-ideas/${idea.id}`} className="block">
          <img src={idea.image_url} alt={idea.title} className="w-full h-20 object-cover" />
        </Link>
      }
      <div className="p-3 flex flex-col flex-grow">
          <div className="flex items-center gap-2 mb-2">
          <img src={authorAvatar} alt={authorName} className="h-6 w-6 rounded-full bg-brand-gray-200 object-cover" />
          <div>
              <p className="font-bold text-white text-sm">{authorName}</p>
              <p className="text-xs text-brand-green">{idea.instrument}</p>
          </div>
          </div>
          <h3 className="text-sm font-bold text-gray-300 mb-2 group-hover:text-white transition-colors">
            <Link to={`/trade-ideas/${idea.id}`} className="hover:text-white transition-colors">{idea.title}</Link>
          </h3>
          <div className="text-xs text-gray-400 mb-2 flex-grow max-w-none overflow-hidden">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {snippet}
            </ReactMarkdown>
          </div>

          <div className="flex items-center justify-between text-gray-400 mt-auto pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                  <LikeButton
                      tradeIdeaId={idea.id}
                      initialLikesCount={likesCount}
                      initialIsLiked={userHasLiked}
                  />
                  <div className="flex gap-1 flex-wrap">
                      {idea.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="bg-brand-gray-200 text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
                          {tag}
                      </span>
                      ))}
                  </div>
              </div>
              <Link to={`/trade-ideas/${idea.id}`} className="flex items-center gap-1 text-brand-green text-xs">
                  Read More
                  <ArrowUpRight size={14} className="transform transition-transform duration-300 group-hover:rotate-45" />
              </Link>
          </div>
      </div>
    </div>
  );
};

export default TradeIdeaCard;
