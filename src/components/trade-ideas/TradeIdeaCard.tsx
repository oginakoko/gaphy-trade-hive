import { TradeIdea } from '@/types';
import { ArrowUpRight, Edit, Share } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LikeButton from './LikeButton';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { MediaItem } from '@/types/media';

interface TradeIdeaCardProps {
  idea: TradeIdea & { media?: MediaItem[] };
  likesCount: number;
  userHasLiked: boolean;
  isAdmin: boolean;
  onEdit: (idea: TradeIdea) => void;
}

const TradeIdeaCard = ({ idea, likesCount, userHasLiked, isAdmin, onEdit }: TradeIdeaCardProps) => {
  const [copiedItemId, setCopiedItemId] = useState<string | number | null>(null);
  const authorName = idea.profiles?.username || 'Anonymous';
  const authorAvatar = idea.profiles?.avatar_url || '/placeholder.svg';
  
  // Get the first image from media items or fallback to image_url
  const firstImage = idea.media?.find(m => m.type === 'image')?.url || idea.image_url;

  // Clean the breakdown text by removing media placeholders and normalizing markdown
  const cleanBreakdown = idea.breakdown
    .replace(/\[MEDIA:[^\]]+\]/g, '') // Remove media placeholders
    .trim()
    .split('\n')[0]; // Take first paragraph

  const snippet = cleanBreakdown.length > 120 
    ? cleanBreakdown.substring(0, 120) + '...' 
    : cleanBreakdown;

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
      
      <Link to={`/trade-ideas/${idea.id}`} className="block">
        <div className="relative">
          {firstImage ? (
            <img 
              src={firstImage} 
              alt={idea.title} 
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-48 bg-brand-gray-200/20 flex items-center justify-center">
              <ArrowUpRight size={24} className="text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <h3 className="text-lg font-bold text-white group-hover:text-brand-green transition-colors line-clamp-2">
              {idea.title}
            </h3>
          </div>
        </div>
      </Link>

      <div className="p-3 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-2">
          <img src={authorAvatar} alt={authorName} className="h-6 w-6 rounded-full bg-brand-gray-200 object-cover" />
          <div className="flex-grow">
            <p className="font-bold text-white text-sm">{authorName}</p>
            <p className="text-xs text-brand-green">{idea.instrument}</p>
          </div>
          <LikeButton 
            tradeIdeaId={idea.id} 
            initialLikesCount={likesCount} 
            initialIsLiked={userHasLiked}
          />
        </div>

        <div className="flex items-center justify-between text-gray-400 mt-auto pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs">
            {idea.tags?.map((tag, index) => (
              <span key={index} className="text-brand-green">#{tag}</span>
            ))}
          </div>
          <span className="text-xs">
            {new Date(idea.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TradeIdeaCard;
