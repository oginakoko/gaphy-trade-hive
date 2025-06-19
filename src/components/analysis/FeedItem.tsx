
import React from 'react';
import { TradeIdea, Ad } from '@/types';
import TradeIdeaCard from '@/components/trade-ideas/TradeIdeaCard';
import AdCard from '@/components/ads/AdCard';
import ServerFeedCard from '@/components/servers/ServerFeedCard';
import { FeedItem } from '@/hooks/useAnalysisFeed';

interface FeedItemProps {
  item: FeedItem;
  userLikes: Set<number>;
  isAdmin?: boolean;
  onEditIdea?: (idea: TradeIdea) => void;
}

const FeedItemComponent = ({ item, userLikes, isAdmin, onEditIdea }: FeedItemProps) => {
  if (item.viewType === 'idea') {
    const tradeIdea = item as TradeIdea & { viewType: 'idea' };
    const ideaIdAsNumber = typeof tradeIdea.id === 'number' ? tradeIdea.id : parseInt(String(tradeIdea.id));
    const likesCount = tradeIdea.likes?.[0]?.count || 0;
    const userHasLiked = userLikes.has(ideaIdAsNumber);
    
    return (
      <TradeIdeaCard 
        idea={tradeIdea} 
        likesCount={likesCount}
        userHasLiked={userHasLiked}
        isAdmin={isAdmin || false}
        onEdit={onEditIdea || (() => {})}
      />
    );
  }

  if (item.viewType === 'ad') {
    const ad = item as Ad & { viewType: 'ad' };
    return <AdCard ad={ad} />;
  }

  return null;
};

export default FeedItemComponent;
