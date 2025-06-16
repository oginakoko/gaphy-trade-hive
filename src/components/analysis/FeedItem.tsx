
import React from 'react';
import { TradeIdea, Ad } from '@/types';
import TradeIdeaCard from '@/components/trade-ideas/TradeIdeaCard';
import AdCard from '@/components/ads/AdCard';
import ServerFeedCard from '@/components/servers/ServerFeedCard';
import { FeedItem } from '@/hooks/useAnalysisFeed';
import { Button } from '@/components/ui/button';
import { Share } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

interface FeedItemProps {
  item: FeedItem;
  userLikes: Set<number>;
  isAdmin?: boolean;
  onEditIdea?: (idea: TradeIdea) => void;
}

const FeedItemComponent = ({ item, userLikes, isAdmin, onEditIdea }: FeedItemProps) => {
  const [copiedItemId, setCopiedItemId] = useState<string | number | null>(null);

  const handleSharePost = async (postId: number, title: string) => {
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

  if (item.viewType === 'idea') {
    const tradeIdea = item as TradeIdea & { viewType: 'idea' };
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSharePost(tradeIdea.id, tradeIdea.title)}
            className="flex items-center gap-2 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-white/10"
          >
            <Share size={14} />
            {copiedItemId === tradeIdea.id ? 'Copied!' : 'Share'}
          </Button>
        </div>
        <TradeIdeaCard 
          idea={tradeIdea} 
          userLikes={userLikes} 
          isAdmin={isAdmin}
          onEdit={onEditIdea}
        />
      </div>
    );
  }

  if (item.viewType === 'ad') {
    const ad = item as Ad & { viewType: 'ad' };
    return <AdCard ad={ad} />;
  }

  return null;
};

export default FeedItemComponent;
