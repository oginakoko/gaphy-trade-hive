
import { FeedItem as FeedItemType } from '@/hooks/useAnalysisFeed';
import TradeIdeaCard from '@/components/trade-ideas/TradeIdeaCard';
import AdCard from '@/components/ads/AdCard';
import { TradeIdea } from '@/types';

interface FeedItemProps {
    item: FeedItemType;
    userLikes: Set<number>;
    isAdmin: boolean;
    onEditIdea: (idea: TradeIdea) => void;
}

const FeedItem = ({ item, userLikes, isAdmin, onEditIdea }: FeedItemProps) => {
    if (item.viewType === 'idea') {
        const likesCount = item.likes?.[0]?.count || 0;
        const userHasLiked = userLikes.has(Number(item.id));
        return (
            <TradeIdeaCard
                idea={item}
                likesCount={likesCount}
                userHasLiked={userHasLiked}
                isAdmin={isAdmin}
                onEdit={onEditIdea}
            />
        );
    }
    
    // item.viewType === 'ad'
    return <AdCard ad={item} />;
};

export default FeedItem;
